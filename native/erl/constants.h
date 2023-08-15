typedef union
{
	double d;
	uint64_t i;
} tp;

#define FORMAT_VERSION 131
//
//
#define NEW_FLOAT_EXT 70	 // [Float:IEEE float]
#define SMALL_INTEGER_EXT 97 // [uint8_t:Value]
#define INTEGER_EXT 98		 // [int32_t:Value]
#define ATOM_EXT 100		 // [Uint16:Length, N:Chars]
#define NIL_EXT 106			 // []
#define STRING_EXT 107		 // [Uint16:Length, N:Chars]
#define LIST_EXT 108		 // [Uint32:Length, N:Elements, uint8_t:Tail]
#define BINARY_EXT 109		 // [Uint32:Length, N:Bytes]
#define SMALL_BIG_EXT 110	 // [Uint8:Arity, Uint8:Sign, N:Digits]
#define LARGE_BIG_EXT 111	 // [Uint32:Arity, Uint8:Sign, N:Digits]
#define SMALL_ATOM_EXT 115	 // [uint8_t:Length, N:Chars]
#define MAP_EXT 116			 // [Uint32:Arity, N:Pairs]
