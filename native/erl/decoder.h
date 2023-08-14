#include <cinttypes>
#include <cstddef>
#include <node.h>
#include <nan.h>

#include "sysdep.h"
#include "constants.h"

using namespace v8;

uint32_t unpack_stats[256];

#define PAST_BUFFER(size_) \
	if(offset + size_ > this->size) { \
		Nan::ThrowError("Reading passes the end of the buffer.");\
		return 0; \
	}

class Decoder {
private:
	const uint8_t* data;
	const size_t size;
	size_t offset;
	bool isInvalid;

public:
	Decoder(uint8_t* data_, size_t size_) : data(data_), size(size_), offset(0), isInvalid(false) {
		if(read8() != FORMAT_VERSION) {
			isInvalid = true;
			Nan::ThrowError("Invalid format version.");
			return;
		}
	}

	Local<Value> static getUnpackStats() {
		Local<Object> obj = Nan::New<Object>();
		for(uint32_t i = 0; i < 256; i++) {
			Nan::Set(obj, Nan::New<String>(std::to_string(i)).ToLocalChecked(), Nan::New<Number>(unpack_stats[i]));
		}
		return obj;
	}

	Local<Value> decode() {
		if(isInvalid) {
			return Nan::Undefined();
		}

		uint8_t tag = read8();
		unpack_stats[tag]++;

		switch(tag) {
			case ATOM_EXT:
				return decodeAtom();
			case BINARY_EXT:
				return readBinaryAsString();
			case SMALL_INTEGER_EXT:
				return Nan::New<Number>(read8());
			case SMALL_BIG_EXT:
				return decodeSmallBig();
			case MAP_EXT:
				return decodeMap();
			case LIST_EXT:
				return decodeList();
			case INTEGER_EXT:
				return Nan::New<Number>(read32());
			case NIL_EXT:
				return Nan::Null();
			case STRING_EXT:
				return Nan::New<String>(readString(read16())).ToLocalChecked();
			case LARGE_BIG_EXT: // basically unused as far as i can tell but whatever
				return decodeLargeBig();


			default:
				isInvalid = true;
				char c[100];
				snprintf(c, 100, "Invalid tag: %u", tag);
				Nan::ThrowError(c);
				return Nan::Undefined();
		}
	};

	// decoding

	Local<Value> decodeMap() {
		uint32_t arity = read32();
		Local<Object> obj = Nan::New<Object>();
		for(uint32_t i = 0; i < arity; i++) {
			Local<Value> key = decode();
			Local<Value> value = decode();
			if(isInvalid) {
				return Nan::Undefined();
			}
			Nan::Set(obj, key, value);
		}
		return obj;
	}

	Local<Value> decodeArray(uint32_t length) {
		Local<Array> arr = Nan::New<Array>(length);
		for(uint32_t i = 0; i < length; i++) {
			Local<Value> value = decode();
			if(isInvalid) {
				return Nan::Undefined();
			}
			Nan::Set(arr, i, value);
		}
		return arr;
	}

	Local<Value> decodeBig(uint32_t n) {
		if(n > 8) {
			isInvalid = true;
			Nan::ThrowError("Big number too large.");
			return Nan::Undefined();
		}

		uint8_t sign = read8();
		uint64_t v = 0;
		uint64_t b = 1;
		for (uint32_t i = 0; i < n; ++i)
		{
			v += read8() * b;
			b <<= 8;
		}

		if(n <= 4) {
			if (sign == 0 || (v & (1 << 31)) != 0)
			{
				return Nan::New<Integer>((uint32_t)(v & 0xFFFFFFFF));
			}
			else
			{
				return Nan::New<Integer>(-(uint32_t)(v & 0xFFFFFFFF));
			}
		}

		char out[32] = {0};
		int res = snprintf(out, 32, sign == 0 ? "%" PRIu64 : "-%" PRIu64, v);
		if(res < 0) {
			isInvalid = true;
			Nan::ThrowError("Failed to format big number.");
			return Nan::Undefined();
		}

		return Nan::New<String>(out, res).ToLocalChecked();
	}

	Local<Value> decodeSmallBig() {
		return decodeBig(read8());
	}

	Local<Value> decodeLargeBig() {
		return decodeBig(read32());
	}

	Local<Value> readBinaryAsString() {
		uint32_t length = read32();
		const char* str = readString(length);
		if(str == NULL) {
			return Nan::Undefined();
		}
		return Nan::New<String>(str, length).ToLocalChecked();
	}

	Local<Value> decodeList() {
		uint32_t length = read32();
		Local<Value> arr = decodeArray(length);
		if(read8() != NIL_EXT) {
			isInvalid = true;
			Nan::ThrowError("List does not end with NIL_EXT.");
			return Nan::Undefined();
		}
		return arr;
	}

	Local<Value> decodeAtom() {
		uint16_t length = read16();
		const char* atom = readString(length);
		return atomHelper(atom, length);
	}

	Local<Value> atomHelper(const char* atom, uint16_t length) {
		if(atom == NULL) {
			return Nan::Undefined();
		}

		if(length >= 3 && length <= 5) {
			if(length == 3 && strncmp(atom, "nil", 3) == 0) {
				return Nan::Null();
			} else if (length == 4 && strncmp(atom, "null", 4) == 0) {
				return Nan::Null();
			} else if (length == 4 && strncmp(atom, "true", 4) == 0) {
				return Nan::True();
			} else if (length == 5 && strncmp(atom, "false", 5) == 0) {
				return Nan::False();
			}
		}

		return Nan::New<String>(atom, length).ToLocalChecked();
	}


	// reading bytes

	uint8_t inline read8() {
		PAST_BUFFER(sizeof(uint8_t));

		uint8_t ret = *reinterpret_cast<const uint8_t *>(data + offset);
		offset += sizeof(uint8_t);
		return ret;
	}

	uint16_t inline read16() {
		PAST_BUFFER(sizeof(uint16_t));

		uint16_t ret = _erlpack_be16(*reinterpret_cast<const uint16_t *>(data + offset));
		offset += sizeof(uint16_t);
		return ret;
	}

	uint32_t inline read32() {
		PAST_BUFFER(sizeof(uint32_t));

		uint32_t ret = _erlpack_be32(*reinterpret_cast<const uint32_t *>(data + offset));
		offset += sizeof(uint32_t);
		return ret;
	}

	uint64_t inline read64() {
		PAST_BUFFER(sizeof(uint64_t));

		uint64_t ret = _erlpack_be64(*reinterpret_cast<const uint64_t *>(data + offset));
		offset += sizeof(uint64_t);
		return ret;
	}

	inline const char* readString(uint32_t length_) {
		PAST_BUFFER(length_);

		const char* ret(reinterpret_cast<const char *>(data + offset));
		offset += length_;
		return ret;
	}
};
