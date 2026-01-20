export enum PrimitiveBufferTypes {
	UInt,
	Double,
	String2L,
	String4L,
	Boolean,
	UInt8 // unsigned tiny int
}

export type PrimitiveBufferTypes_ByteSize_Map = {
	[key in PrimitiveBufferTypes]: number
}

export type BufferValueMapTypeMap<T> = {
	[key in keyof T]: PrimitiveBufferTypes.UInt | PrimitiveBufferTypes.Double
}
