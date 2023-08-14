#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>
#include <node.h>
#include <nan.h>

using namespace v8;

class Encoder
{
	static const size_t DEFAULT_RECURSION_LIMIT = 256;
	static const size_t INITIAL_BUFFER_SIZE = 1024 * 1024;

private:
	char *buf;
	size_t length;
	size_t allocated_size;

public:
	Encoder()
	{
		buf = (char *)malloc(sizeof(char) * INITIAL_BUFFER_SIZE);
		length = 0;
		allocated_size = INITIAL_BUFFER_SIZE;
		if (buf == NULL)
		{
			Nan::ThrowError("Unable to allocate large buffer for encoding.");
		}
		else if (append_version() != 0)
		{
			Nan::ThrowError("Failed to append version to buffer.");
		}
	}

	~Encoder()
	{
		if (buf)
		{
			free(buf);
		}

		buf = NULL;
		length = 0;
		allocated_size = 0;
	}

	Nan::MaybeLocal<Object> output() {
		if(buf == NULL) {
			return Nan::MaybeLocal<Object>();
		}

		auto b = Nan::NewBuffer(length);
		memcpy(node::Buffer::Data(b.ToLocalChecked()), buf, length);
		return b;
	}

	int encode(Local<Value> value, int nestLimit = DEFAULT_RECURSION_LIMIT)
	{
		if (nestLimit-- <= 0)
		{
			Nan::ThrowError("Reached recursion limit");
			return -1;
		}
		int ret = 0;

		if (value->IsInt32() || value->IsUint32())
		{
			int number = value->Int32Value(Nan::GetCurrentContext()).FromJust();
			if (number >= 0 && number <= 255)
			{
				ret = append_small_integer(number);
			}
			else if (value->IsInt32())
			{
				ret = append_integer(number);
			}
			else
			{
				ret = append_ull(value->Uint32Value(Nan::GetCurrentContext()).FromJust());
			}
		}
		else if (value->IsNumber())
		{
			ret = append_double(value->NumberValue(Nan::GetCurrentContext()).FromJust());
		}
		else if (value->IsNull() || value->IsUndefined())
		{
			ret = append_nil();
		}
		else if (value->IsTrue())
		{
			ret = append_true();
		}
		else if (value->IsFalse())
		{
			ret = append_false();
		}
		else if (value->IsString())
		{
			Nan::Utf8String str(value);
			ret = append_binary(*str, str.length());
		}
		else if (value->IsArray())
		{
			Local<Array> arr = Local<Array>::Cast(value);
			uint32_t length = arr->Length();
			if (length == 0)
			{
				if ((ret = append_nil_ext()) != 0)
				{
					return ret;
				}
			}
			else if (length > std::numeric_limits<uint32_t>::max() - 1)
			{
				Nan::ThrowError("List is too long");
				return -1;
			}
			else
			{
				if ((ret = append_list_header(length)) != 0)
				{
					return ret;
				}

				for (uint32_t i = 0; i < length; i++)
				{
					Local<Value> value = Nan::Get(arr, i).ToLocalChecked();
					if ((ret = encode(value, nestLimit)) != 0)
					{
						return ret;
					}
				}
				ret = append_nil_ext();
			}
		}
		else if (value->IsObject())
		{
			Local<Object> obj = Local<Object>::Cast(value);
			Local<Array> props = Nan::GetOwnPropertyNames(obj).ToLocalChecked();
			uint32_t length = props->Length();

			if (length > std::numeric_limits<uint32_t>::max() - 1)
			{
				Nan::ThrowError("Object has too many properties");
				return -1;
			}

			if ((ret = append_map_header(length)) != 0)
			{
				return ret;
			}

			for (uint32_t i = 0; i < length; i++)
			{
				Local<Value> key = Nan::Get(props, i).ToLocalChecked();
				Local<Value> value = Nan::Get(obj, key).ToLocalChecked();
				if ((ret = encode(key, nestLimit)) != 0)
				{
					return ret;
				}
				if ((ret = encode(value, nestLimit)) != 0)
				{
					return ret;
				}
			}
		}

		return ret;
	}

	inline int append(const char *data, size_t len)
	{
		if (length + len >= allocated_size)
		{
			size_t new_size = allocated_size << 1;
			char *new_buf = (char *)realloc(buf, new_size);
			if (new_buf == NULL)
			{
				return -1;
			}
			buf = new_buf;
			allocated_size = new_size;
		}
		memcpy(buf + length, data, len);
		length += len;
		return 0;
	}

	inline int append_version()
	{
		static const char buf[1] = {(char)FORMAT_VERSION};
		return append(buf, 1);
	}

	inline int append_nil()
	{
		static const char buf[5] = {SMALL_ATOM_EXT, 3, 'n', 'i', 'l'};
		return append(buf, 5);
	}

	inline int append_false()
	{
		static const char buf[7] = {SMALL_ATOM_EXT, 5, 'f', 'a', 'l', 's', 'e'};
		return append(buf, 7);
	}

	inline int append_true()
	{
		static const char buf[6] = {SMALL_ATOM_EXT, 4, 't', 'r', 'u', 'e'};
		return append(buf, 6);
	}

	inline int append_nil_ext()
	{
		static const char buf[1] = {NIL_EXT};
		return append(buf, 1);
	}

	inline int append_small_integer(uint8_t d)
	{
		const char buf[2] = {SMALL_INTEGER_EXT, d};
		return append(buf, 2);
	}

	inline int append_integer(int32_t d)
	{
		char buf[5];
		buf[0] = INTEGER_EXT;
		_erlpack_store32(buf + 1, d);
		return append(buf, 5);
	}

	inline int append_ull(uint64_t d)
	{
		char buf[3 + sizeof(uint64_t)];
		buf[0] = SMALL_BIG_EXT;
		uint8_t bytes_enc = 0;
		while (d > 0)
		{
			buf[3 + bytes_enc] = d & 0xFF;
			d >>= 8;
			bytes_enc++;
		}
		buf[1] = bytes_enc;
		buf[2] = 0;
		return append(buf, 3 + bytes_enc);
	}

	inline int append_ll(long long d)
	{
		char buf[3 + sizeof(long long)];
		buf[0] = SMALL_BIG_EXT;
		buf[2] = d < 0 ? 1 : 0;
		uint64_t ull = d < 0 ? -d : d;
		uint8_t bytes_enc = 0;
		while (ull > 0)
		{
			buf[3 + bytes_enc] = ull & 0xFF;
			ull >>= 8;
			bytes_enc++;
		}
		buf[1] = bytes_enc;
		return append(buf, 3 + bytes_enc);
	}

	inline int append_double(double d)
	{
		char buf[9];
		buf[0] = NEW_FLOAT_EXT;
		_erlpack_store64(buf + 1, d);
		return append(buf, 9);
	}

	inline int append_binary(char *bytes, size_t size)
	{
		char buf[5];
		buf[0] = BINARY_EXT;
		_erlpack_store32(buf + 1, size);
		append(buf, 5);
		return append(bytes, size);
	}

	inline int append_list_header(uint32_t length)
	{
		char buf[5];
		buf[0] = LIST_EXT;
		_erlpack_store32(buf + 1, length);
		return append(buf, 5);
	}

	inline int append_map_header(uint32_t arity)
	{
		char buf[5];
		buf[0] = MAP_EXT;
		_erlpack_store32(buf + 1, arity);
		return append(buf, 5);
	}
};
