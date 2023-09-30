#include <node.h>
#include "decoder.h"
#include "encoder.h"

using v8::Exception;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::TypedArray;
using v8::ArrayBuffer;
using v8::Value;

void Pack(const FunctionCallbackInfo<Value> &info)
{
	Isolate *isolate = info.GetIsolate();

	Encoder encoder;
	int ret = encoder.encode(info[0]);
	if(ret != 0) {
		isolate->ThrowException(Exception::TypeError(
			String::NewFromUtf8(isolate, "Failed to encode value.").ToLocalChecked()));
	}

	info.GetReturnValue().Set(encoder.output().ToLocalChecked());
}

void Unpack(const FunctionCallbackInfo<Value> &info)
{
	Isolate *isolate = info.GetIsolate();

	if (!info[0]->IsObject() || !info[0]->IsTypedArray())
	{
		isolate->ThrowException(Exception::TypeError(
			String::NewFromUtf8(isolate, "Attempted to unpack something that isnt a TypedArray.").ToLocalChecked()));
		return;
	}

	Local<TypedArray> buf = Local<TypedArray>::Cast(info[0]->ToObject(isolate->GetCurrentContext()).ToLocalChecked());
	if (!buf->HasBuffer())
	{
		isolate->ThrowException(Exception::TypeError(
			String::NewFromUtf8(isolate, "Attempted to unpack a TypedArray without an allocated Buffer").ToLocalChecked()));
		return;
	}

	size_t len = buf->ByteLength();
	if (len == 0)
	{
		isolate->ThrowException(Exception::TypeError(
			String::NewFromUtf8(isolate, "Zero length buffer.").ToLocalChecked()));
		return;
	}

	Decoder decoder((uint8_t*)(buf->Buffer()->Data()), len);
	info.GetReturnValue().Set(decoder.decode());
}

void Init(Local<Object> exports)
{
	NODE_SET_METHOD(exports, "pack", Pack);
	NODE_SET_METHOD(exports, "unpack", Unpack);
}

NAN_MODULE_WORKER_ENABLED(NODE_GYP_MODULE_NAME, Init)
