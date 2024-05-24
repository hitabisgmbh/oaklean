import { BufferHelper, PrimitiveBufferTypes } from '../../src/helper/BufferHelper'

const EXAMPLE_STRING_2L = 'Hello World'
const EXAMPLE_STRING_2L_BUFFER = '0b0048656c6c6f20576f726c64'

const EXAMPLE_STRING_4L = 'Hello World'
const EXAMPLE_STRING_4L_BUFFER = '0b00000048656c6c6f20576f726c64'

const EXAMPLE_UINT = 12345678
const EXAMPLE_UINT_BUFFER = '4e61bc00'

const EXAMPLE_DOUBLE = 123.45678
const EXAMPLE_DOUBLE_BUFFER = 'e15d2ee23bdd5e40'

const EXAMPLE_DECOMPRESSED_DATA = 'Hello World'
const EXAMPLE_COMPRESSED_DATA = '789cf348cdc9c95708cf2fca490100180b041d'

function demoNumberMap(length: number, empty = false) {
	const typeMap: Record<string, PrimitiveBufferTypes.UInt | PrimitiveBufferTypes.Double> = {}

	const values: Record<string, number> = {}

	for (let i = 1; i < length + 1; i++) {
		typeMap[i.toString()] = i % 2 === 0 ? PrimitiveBufferTypes.Double : PrimitiveBufferTypes.UInt
		values[i.toString()] = empty ? 0 : i % 2 === 0 ? i / 1000 : i
	}

	return {
		typeMap,
		values
	}
}

describe('BufferHelper', () => {
	describe('Tiny Int', () => {
		it('converts tiny int to buffer', () => {
			expect(BufferHelper.UInt8ToBuffer(1).toString('hex')).toBe('01')
			expect(BufferHelper.UInt8ToBuffer(255).toString('hex')).toBe('ff')
		})

		it('converts buffer to tiny int', () => {
			const {
				instance: trueInstance,
				remainingBuffer: trueRemainingBuffer
			} = BufferHelper.UInt8FromBuffer(Buffer.from('01', 'hex'))
			expect(trueInstance).toBe(1)
			expect(trueRemainingBuffer.byteLength).toBe(0)

			const {
				instance: falseInstance,
				remainingBuffer: falseRemainingBuffer
			} = BufferHelper.UInt8FromBuffer(Buffer.from('ff', 'hex'))
			expect(falseInstance).toBe(255)
			expect(falseRemainingBuffer.byteLength).toBe(0)
		})
	})

	describe('Boolean', () => {
		it('converts boolean to buffer', () => {
			expect(BufferHelper.BooleanToBuffer(true).toString('hex')).toBe('01')
			expect(BufferHelper.BooleanToBuffer(false).toString('hex')).toBe('00')
		})

		it('converts buffer to boolean', () => {
			const {
				instance: trueInstance,
				remainingBuffer: trueRemainingBuffer
			} = BufferHelper.BooleanFromBuffer(Buffer.from('01', 'hex'))
			expect(trueInstance).toBe(true)
			expect(trueRemainingBuffer.byteLength).toBe(0)

			const {
				instance: falseInstance,
				remainingBuffer: falseRemainingBuffer
			} = BufferHelper.BooleanFromBuffer(Buffer.from('00', 'hex'))
			expect(falseInstance).toBe(false)
			expect(falseRemainingBuffer.byteLength).toBe(0)
		})
	})

	describe('String2L', () => {
		it('converts string to buffer', () => {
			expect(BufferHelper.String2LToBuffer(EXAMPLE_STRING_2L).toString('hex')).toBe(EXAMPLE_STRING_2L_BUFFER)
		})

		it('converts buffer to string', () => {
			const { instance, remainingBuffer } = BufferHelper.String2LFromBuffer(Buffer.from(EXAMPLE_STRING_2L_BUFFER, 'hex'))

			expect(instance).toBe(EXAMPLE_STRING_2L)
			expect(remainingBuffer.byteLength).toBe(0)
		})
	})

	describe('String4L', () => {
		it('converts string to buffer', () => {
			expect(BufferHelper.String4LToBuffer(EXAMPLE_STRING_4L).toString('hex')).toBe(EXAMPLE_STRING_4L_BUFFER)
		})

		it('converts buffer to string', () => {
			const { instance, remainingBuffer } = BufferHelper.String4LFromBuffer(Buffer.from(EXAMPLE_STRING_4L_BUFFER, 'hex'))

			expect(instance).toBe(EXAMPLE_STRING_4L)
			expect(remainingBuffer.byteLength).toBe(0)
		})
	})
	describe('UInt', () => {
		it('converts UInt to buffer', () => {
			expect(BufferHelper.UIntToBuffer(EXAMPLE_UINT).toString('hex')).toBe(EXAMPLE_UINT_BUFFER)
		})

		it('converts buffer to UInt', () => {
			const { instance, remainingBuffer } = BufferHelper.UIntFromBuffer(Buffer.from(EXAMPLE_UINT_BUFFER, 'hex'))

			expect(instance).toBe(EXAMPLE_UINT)
			expect(remainingBuffer.byteLength).toBe(0)
		})
	})

	describe('Double', () => {
		it('converts UInt to buffer', () => {
			expect(BufferHelper.DoubleToBuffer(EXAMPLE_DOUBLE).toString('hex')).toBe(EXAMPLE_DOUBLE_BUFFER)
		})

		it('converts buffer to UInt', () => {
			const { instance, remainingBuffer } = BufferHelper.DoubleFromBuffer(Buffer.from(EXAMPLE_DOUBLE_BUFFER, 'hex'))

			expect(instance).toBe(EXAMPLE_DOUBLE)
			expect(remainingBuffer.byteLength).toBe(0)
		})
	})
	

	it('sets and reads bits in a buffer correctly', () => {
		const buffer = Buffer.alloc(128)
		for (let i = 0; i < 128*8; i++) {
			if (i % 3 === 0) {
				BufferHelper.setBit(buffer, i, 1)
			}
		}
		expect(buffer.toString('hex')).toEqual('4992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992244992')
		for (let i = 0; i < 128 * 8; i++) {
			if (i % 3 === 0) {
				expect(BufferHelper.readBit(buffer, i)).toBe(1)
			} else {
				expect(BufferHelper.readBit(buffer, i)).toBe(0)
			}
		}
	})

	describe('compression', () => {
		it('compresses correctly', async () => {
			const data = Buffer.from(EXAMPLE_DECOMPRESSED_DATA)
			expect((await BufferHelper.compressBuffer(data)).toString('hex')).toEqual(EXAMPLE_COMPRESSED_DATA)
		})

		it('decompresses correctly', async () => {
			const data = Buffer.from(EXAMPLE_COMPRESSED_DATA, 'hex')
			expect((await BufferHelper.decompressBuffer(data)).toString()).toEqual(EXAMPLE_DECOMPRESSED_DATA)
		})

		it('decompresses with error', async () => {
			const t = async () => {
				await BufferHelper.decompressBuffer(Buffer.from('abc'))
			}

			expect(t).rejects.toThrow('incorrect header check')
		})
	})

	describe('valueMap', () => {
		describe('large', () => {
			const { typeMap, values } = demoNumberMap(1000)
			const expectedBuffer = 'ffff01000000fca9f1d24d62603f03000000fca9f1d24d62703f05000000fa7e6abc7493783f07000000fca9f1d24d62803f090000007b14ae47e17a843f0b000000fa7e6abc7493883f0d00000079e9263108ac8c3f0f000000fffffca9f1d24d62903f110000003bdf4f8d976e923f130000007b14ae47e17a943f15000000ba490c022b87963f17000000fa7e6abc7493983f1900000039b4c876be9f9a3f1b00000079e9263108ac9c3f1d000000b81e85eb51b89e3fffff1f000000fca9f1d24d62a03f210000009cc420b07268a13f230000003bdf4f8d976ea23f25000000dbf97e6abc74a33f270000007b14ae47e17aa43f290000001b2fdd240681a53f2b000000ba490c022b87a63f2d000000ffff5a643bdf4f8da73f2f000000fa7e6abc7493a83f310000009a9999999999a93f3300000039b4c876be9faa3f35000000d9cef753e3a5ab3f3700000079e9263108acac3f390000001904560e2db2ad3f3b000000b81e85eb51b8ae3fffff3d0000005839b4c876beaf3f3f000000fca9f1d24d62b03f410000004c37894160e5b03f430000009cc420b07268b13f45000000ec51b81e85ebb13f470000003bdf4f8d976eb23f490000008b6ce7fba9f1b23f4b000000ffffdbf97e6abc74b33f4d0000002b8716d9cef7b33f4f0000007b14ae47e17ab43f51000000cba145b6f3fdb43f530000001b2fdd240681b53f550000006abc74931804b63f57000000ba490c022b87b63f590000000ad7a3703d0ab73fffff5b0000005a643bdf4f8db73f5d000000aaf1d24d6210b83f5f000000fa7e6abc7493b83f610000004a0c022b8716b93f630000009a9999999999b93f65000000e9263108ac1cba3f6700000039b4c876be9fba3f69000000ffff894160e5d022bb3f6b000000d9cef753e3a5bb3f6d000000295c8fc2f528bc3f6f00000079e9263108acbc3f71000000c976be9f1a2fbd3f730000001904560e2db2bd3f750000006891ed7c3f35be3f77000000b81e85eb51b8be3fffff7900000008ac1c5a643bbf3f7b0000005839b4c876bebf3f7d00000054e3a59bc420c03f7f000000fca9f1d24d62c03f81000000a4703d0ad7a3c03f830000004c37894160e5c03f85000000f4fdd478e926c13f87000000ffff9cc420b07268c13f89000000448b6ce7fba9c13f8b000000ec51b81e85ebc13f8d000000931804560e2dc23f8f0000003bdf4f8d976ec23f91000000e3a59bc420b0c23f930000008b6ce7fba9f1c23f95000000333333333333c33fffff97000000dbf97e6abc74c33f9900000083c0caa145b6c33f9b0000002b8716d9cef7c33f9d000000d34d62105839c43f9f0000007b14ae47e17ac43fa100000023dbf97e6abcc43fa3000000cba145b6f3fdc43fa5000000ffff736891ed7c3fc53fa70000001b2fdd240681c53fa9000000c3f5285c8fc2c53fab0000006abc74931804c63fad0000001283c0caa145c63faf000000ba490c022b87c63fb100000062105839b4c8c63fb30000000ad7a3703d0ac73fffffb5000000b29defa7c64bc73fb70000005a643bdf4f8dc73fb9000000022b8716d9cec73fbb000000aaf1d24d6210c83fbd00000052b81e85eb51c83fbf000000fa7e6abc7493c83fc1000000a245b6f3fdd4c83fc3000000ffff4a0c022b8716c93fc5000000f2d24d621058c93fc70000009a9999999999c93fc90000004260e5d022dbc93fcb000000e9263108ac1cca3fcd00000091ed7c3f355eca3fcf00000039b4c876be9fca3fd1000000e17a14ae47e1ca3fffffd3000000894160e5d022cb3fd50000003108ac1c5a64cb3fd7000000d9cef753e3a5cb3fd90000008195438b6ce7cb3fdb000000295c8fc2f528cc3fdd000000d122dbf97e6acc3fdf00000079e9263108accc3fe1000000ffff21b0726891edcc3fe3000000c976be9f1a2fcd3fe5000000713d0ad7a370cd3fe70000001904560e2db2cd3fe9000000c1caa145b6f3cd3feb0000006891ed7c3f35ce3fed000000105839b4c876ce3fef000000b81e85eb51b8ce3ffffff100000060e5d022dbf9ce3ff300000008ac1c5a643bcf3ff5000000b0726891ed7ccf3ff70000005839b4c876becf3ff9000000000000000000d03ffb00000054e3a59bc420d03ffd000000a8c64b378941d03fff000000fffffca9f1d24d62d03f01010000508d976e1283d03f03010000a4703d0ad7a3d03f05010000f853e3a59bc4d03f070100004c37894160e5d03f09010000a01a2fdd2406d13f0b010000f4fdd478e926d13f0d01000048e17a14ae47d13fffff0f0100009cc420b07268d13f11010000f0a7c64b3789d13f13010000448b6ce7fba9d13f15010000986e1283c0cad13f17010000ec51b81e85ebd13f190100003f355eba490cd23f1b010000931804560e2dd23f1d010000ffffe7fba9f1d24dd23f1f0100003bdf4f8d976ed23f210100008fc2f5285c8fd23f23010000e3a59bc420b0d23f2501000037894160e5d0d23f270100008b6ce7fba9f1d23f29010000df4f8d976e12d33f2b010000333333333333d33fffff2d0100008716d9cef753d33f2f010000dbf97e6abc74d33f310100002fdd24068195d33f3301000083c0caa145b6d33f35010000d7a3703d0ad7d33f370100002b8716d9cef7d33f390100007f6abc749318d43f3b010000ffffd34d62105839d43f3d010000273108ac1c5ad43f3f0100007b14ae47e17ad43f41010000cff753e3a59bd43f4301000023dbf97e6abcd43f4501000077be9f1a2fddd43f47010000cba145b6f3fdd43f490100001f85eb51b81ed53fffff4b010000736891ed7c3fd53f4d010000c74b37894160d53f4f0100001b2fdd240681d53f510100006f1283c0caa1d53f53010000c3f5285c8fc2d53f5501000017d9cef753e3d53f570100006abc74931804d63f59010000ffffbe9f1a2fdd24d63f5b0100001283c0caa145d63f5d010000666666666666d63f5f010000ba490c022b87d63f610100000e2db29defa7d63f6301000062105839b4c8d63f65010000b6f3fdd478e9d63f670100000ad7a3703d0ad73fffff690100005eba490c022bd73f6b010000b29defa7c64bd73f6d010000068195438b6cd73f6f0100005a643bdf4f8dd73f71010000ae47e17a14aed73f73010000022b8716d9ced73f75010000560e2db29defd73f77010000ffffaaf1d24d6210d83f79010000fed478e92631d83f7b01000052b81e85eb51d83f7d010000a69bc420b072d83f7f010000fa7e6abc7493d83f810100004e62105839b4d83f83010000a245b6f3fdd4d83f85010000f6285c8fc2f5d83fffff870100004a0c022b8716d93f890100009eefa7c64b37d93f8b010000f2d24d621058d93f8d01000046b6f3fdd478d93f8f0100009a9999999999d93f91010000ee7c3f355ebad93f930100004260e5d022dbd93f95010000ffff96438b6ce7fbd93f97010000e9263108ac1cda3f990100003d0ad7a3703dda3f9b01000091ed7c3f355eda3f9d010000e5d022dbf97eda3f9f01000039b4c876be9fda3fa10100008d976e1283c0da3fa3010000e17a14ae47e1da3fffffa5010000355eba490c02db3fa7010000894160e5d022db3fa9010000dd2406819543db3fab0100003108ac1c5a64db3fad01000085eb51b81e85db3faf010000d9cef753e3a5db3fb10100002db29defa7c6db3fb3010000ffff8195438b6ce7db3fb5010000d578e9263108dc3fb7010000295c8fc2f528dc3fb90100007d3f355eba49dc3fbb010000d122dbf97e6adc3fbd01000025068195438bdc3fbf01000079e9263108acdc3fc1010000cdccccccccccdc3fffffc301000021b0726891eddc3fc501000075931804560edd3fc7010000c976be9f1a2fdd3fc90100001d5a643bdf4fdd3fcb010000713d0ad7a370dd3fcd010000c520b0726891dd3fcf0100001904560e2db2dd3fd1010000ffff6de7fba9f1d2dd3fd3010000c1caa145b6f3dd3fd501000014ae47e17a14de3fd70100006891ed7c3f35de3fd9010000bc7493180456de3fdb010000105839b4c876de3fdd010000643bdf4f8d97de3fdf010000b81e85eb51b8de3fffffe10100000c022b8716d9de3fe301000060e5d022dbf9de3fe5010000b4c876be9f1adf3fe701000008ac1c5a643bdf3fe90100005c8fc2f5285cdf3feb010000b0726891ed7cdf3fed01000004560e2db29ddf3fef010000ffff5839b4c876bedf3ff1010000ac1c5a643bdfdf3ff3010000000000000000e03ff5010000aaf1d24d6210e03ff701000054e3a59bc420e03ff9010000fed478e92631e03ffb010000a8c64b378941e03ffd01000052b81e85eb51e03fffffff010000fca9f1d24d62e03f01020000a69bc420b072e03f03020000508d976e1283e03f05020000fa7e6abc7493e03f07020000a4703d0ad7a3e03f090200004e62105839b4e03f0b020000f853e3a59bc4e03f0d020000ffffa245b6f3fdd4e03f0f0200004c37894160e5e03f11020000f6285c8fc2f5e03f13020000a01a2fdd2406e13f150200004a0c022b8716e13f17020000f4fdd478e926e13f190200009eefa7c64b37e13f1b02000048e17a14ae47e13fffff1d020000f2d24d621058e13f1f0200009cc420b07268e13f2102000046b6f3fdd478e13f23020000f0a7c64b3789e13f250200009a9999999999e13f27020000448b6ce7fba9e13f29020000ee7c3f355ebae13f2b020000ffff986e1283c0cae13f2d0200004260e5d022dbe13f2f020000ec51b81e85ebe13f3102000096438b6ce7fbe13f330200003f355eba490ce23f35020000e9263108ac1ce23f37020000931804560e2de23f390200003d0ad7a3703de23fffff3b020000e7fba9f1d24de23f3d02000091ed7c3f355ee23f3f0200003bdf4f8d976ee23f41020000e5d022dbf97ee23f430200008fc2f5285c8fe23f4502000039b4c876be9fe23f47020000e3a59bc420b0e23f49020000ffff8d976e1283c0e23f4b02000037894160e5d0e23f4d020000e17a14ae47e1e23f4f0200008b6ce7fba9f1e23f51020000355eba490c02e33f53020000df4f8d976e12e33f55020000894160e5d022e33f57020000333333333333e33fffff59020000dd2406819543e33f5b0200008716d9cef753e33f5d0200003108ac1c5a64e33f5f020000dbf97e6abc74e33f6102000085eb51b81e85e33f630200002fdd24068195e33f65020000d9cef753e3a5e33f67020000ffff83c0caa145b6e33f690200002db29defa7c6e33f6b020000d7a3703d0ad7e33f6d0200008195438b6ce7e33f6f0200002b8716d9cef7e33f71020000d578e9263108e43f730200007f6abc749318e43f75020000295c8fc2f528e43fffff77020000d34d62105839e43f790200007d3f355eba49e43f7b020000273108ac1c5ae43f7d020000d122dbf97e6ae43f7f0200007b14ae47e17ae43f8102000025068195438be43f83020000cff753e3a59be43f85020000ffff79e9263108ace43f8702000023dbf97e6abce43f89020000cdcccccccccce43f8b02000077be9f1a2fdde43f8d02000021b0726891ede43f8f020000cba145b6f3fde43f9102000075931804560ee53f930200001f85eb51b81ee53fffff95020000c976be9f1a2fe53f97020000736891ed7c3fe53f990200001d5a643bdf4fe53f9b020000c74b37894160e53f9d020000713d0ad7a370e53f9f0200001b2fdd240681e53fa1020000c520b0726891e53fa3020000ffff6f1283c0caa1e53fa50200001904560e2db2e53fa7020000c3f5285c8fc2e53fa90200006de7fba9f1d2e53fab02000017d9cef753e3e53fad020000c1caa145b6f3e53faf0200006abc74931804e63fb102000014ae47e17a14e63fffffb3020000be9f1a2fdd24e63fb50200006891ed7c3f35e63fb70200001283c0caa145e63fb9020000bc7493180456e63fbb020000666666666666e63fbd020000105839b4c876e63fbf020000ba490c022b87e63fc1020000ffff643bdf4f8d97e63fc30200000e2db29defa7e63fc5020000b81e85eb51b8e63fc702000062105839b4c8e63fc90200000c022b8716d9e63fcb020000b6f3fdd478e9e63fcd02000060e5d022dbf9e63fcf0200000ad7a3703d0ae73fffffd1020000b4c876be9f1ae73fd30200005eba490c022be73fd502000008ac1c5a643be73fd7020000b29defa7c64be73fd90200005c8fc2f5285ce73fdb020000068195438b6ce73fdd020000b0726891ed7ce73fdf020000ffff5a643bdf4f8de73fe102000004560e2db29de73fe3020000ae47e17a14aee73fe50200005839b4c876bee73fe7020000022b8716d9cee73fe9020000ac1c5a643bdfe73feb020000560e2db29defe73fed020000000000000000e83fffffef020000aaf1d24d6210e83ff102000054e3a59bc420e83ff3020000fed478e92631e83ff5020000a8c64b378941e83ff702000052b81e85eb51e83ff9020000fca9f1d24d62e83ffb020000a69bc420b072e83ffd020000ffff508d976e1283e83fff020000fa7e6abc7493e83f01030000a4703d0ad7a3e83f030300004e62105839b4e83f05030000f853e3a59bc4e83f07030000a245b6f3fdd4e83f090300004c37894160e5e83f0b030000f6285c8fc2f5e83fffff0d030000a01a2fdd2406e93f0f0300004a0c022b8716e93f11030000f4fdd478e926e93f130300009eefa7c64b37e93f1503000048e17a14ae47e93f17030000f2d24d621058e93f190300009cc420b07268e93f1b030000ffff46b6f3fdd478e93f1d030000f0a7c64b3789e93f1f0300009a9999999999e93f21030000448b6ce7fba9e93f23030000ee7c3f355ebae93f25030000986e1283c0cae93f270300004260e5d022dbe93f29030000ec51b81e85ebe93fffff2b03000096438b6ce7fbe93f2d0300003f355eba490cea3f2f030000e9263108ac1cea3f31030000931804560e2dea3f330300003d0ad7a3703dea3f35030000e7fba9f1d24dea3f3703000091ed7c3f355eea3f39030000ffff3bdf4f8d976eea3f3b030000e5d022dbf97eea3f3d0300008fc2f5285c8fea3f3f03000039b4c876be9fea3f41030000e3a59bc420b0ea3f430300008d976e1283c0ea3f4503000037894160e5d0ea3f47030000e17a14ae47e1ea3fffff490300008b6ce7fba9f1ea3f4b030000355eba490c02eb3f4d030000df4f8d976e12eb3f4f030000894160e5d022eb3f51030000333333333333eb3f53030000dd2406819543eb3f550300008716d9cef753eb3f57030000ffff3108ac1c5a64eb3f59030000dbf97e6abc74eb3f5b03000085eb51b81e85eb3f5d0300002fdd24068195eb3f5f030000d9cef753e3a5eb3f6103000083c0caa145b6eb3f630300002db29defa7c6eb3f65030000d7a3703d0ad7eb3fffff670300008195438b6ce7eb3f690300002b8716d9cef7eb3f6b030000d578e9263108ec3f6d0300007f6abc749318ec3f6f030000295c8fc2f528ec3f71030000d34d62105839ec3f730300007d3f355eba49ec3f75030000ffff273108ac1c5aec3f77030000d122dbf97e6aec3f790300007b14ae47e17aec3f7b03000025068195438bec3f7d030000cff753e3a59bec3f7f03000079e9263108acec3f8103000023dbf97e6abcec3f83030000cdccccccccccec3fffff8503000077be9f1a2fddec3f8703000021b0726891edec3f89030000cba145b6f3fdec3f8b03000075931804560eed3f8d0300001f85eb51b81eed3f8f030000c976be9f1a2fed3f91030000736891ed7c3fed3f93030000ffff1d5a643bdf4fed3f95030000c74b37894160ed3f97030000713d0ad7a370ed3f990300001b2fdd240681ed3f9b030000c520b0726891ed3f9d0300006f1283c0caa1ed3f9f0300001904560e2db2ed3fa1030000c3f5285c8fc2ed3fffffa30300006de7fba9f1d2ed3fa503000017d9cef753e3ed3fa7030000c1caa145b6f3ed3fa90300006abc74931804ee3fab03000014ae47e17a14ee3fad030000be9f1a2fdd24ee3faf0300006891ed7c3f35ee3fb1030000ffff1283c0caa145ee3fb3030000bc7493180456ee3fb5030000666666666666ee3fb7030000105839b4c876ee3fb9030000ba490c022b87ee3fbb030000643bdf4f8d97ee3fbd0300000e2db29defa7ee3fbf030000b81e85eb51b8ee3fffffc103000062105839b4c8ee3fc30300000c022b8716d9ee3fc5030000b6f3fdd478e9ee3fc703000060e5d022dbf9ee3fc90300000ad7a3703d0aef3fcb030000b4c876be9f1aef3fcd0300005eba490c022bef3fcf030000ffff08ac1c5a643bef3fd1030000b29defa7c64bef3fd30300005c8fc2f5285cef3fd5030000068195438b6cef3fd7030000b0726891ed7cef3fd90300005a643bdf4f8def3fdb03000004560e2db29def3fdd030000ae47e17a14aeef3fff03df0300005839b4c876beef3fe1030000022b8716d9ceef3fe3030000ac1c5a643bdfef3fe5030000560e2db29defef3fe7030000000000000000f03f'

			it('converts values to buffer', () => {
				const buffer = BufferHelper.numberMapToBuffer(
					typeMap,
					values
				)
				expect(buffer.toString('hex')).toEqual(expectedBuffer)
			})

			it('converts buffer to values', () => {
				const {
					instance,
					remainingBuffer
				} = BufferHelper.numberMapFromBuffer(
					typeMap,
					Buffer.from(expectedBuffer, 'hex')
				)
				expect(instance).toEqual(values)
				expect(remainingBuffer.length).toBe(0)
			})
		})

		describe('large empty', () => {
			const { typeMap, values } = demoNumberMap(1000, true)
			const expectedBuffer = '0000'

			it('converts values to buffer', () => {
				const buffer = BufferHelper.numberMapToBuffer(
					typeMap,
					values
				)
				expect(buffer.toString('hex')).toEqual(expectedBuffer)
			})

			it('converts buffer to values', () => {
				const {
					instance,
					remainingBuffer
				} = BufferHelper.numberMapFromBuffer(
					typeMap,
					Buffer.from(expectedBuffer, 'hex')
				)
				expect(instance).toEqual(values)
				expect(remainingBuffer.length).toBe(0)
			})
		})

		describe('small', () => {
			const { typeMap, values } = demoNumberMap(10)
			const expectedBuffer = 'ff0301000000fca9f1d24d62603f03000000fca9f1d24d62703f05000000fa7e6abc7493783f07000000fca9f1d24d62803f090000007b14ae47e17a843f'

			it('converts values to buffer', () => {
				const buffer = BufferHelper.numberMapToBuffer(
					typeMap,
					values
				)
				expect(buffer.toString('hex')).toEqual(expectedBuffer)
			})

			it('converts buffer to values', () => {
				const {
					instance,
					remainingBuffer
				} = BufferHelper.numberMapFromBuffer(
					typeMap,
					Buffer.from(expectedBuffer, 'hex')
				)
				expect(instance).toEqual(values)
				expect(remainingBuffer.length).toBe(0)
			})
		})

		describe('tiny', () => {
			const { typeMap, values } = demoNumberMap(1)
			const expectedBuffer = '010001000000'

			it('converts values to buffer', () => {
				const buffer = BufferHelper.numberMapToBuffer(
					typeMap,
					values
				)
				expect(buffer.toString('hex')).toEqual(expectedBuffer)
			})

			it('converts buffer to values', () => {
				const {
					instance,
					remainingBuffer
				} = BufferHelper.numberMapFromBuffer(
					typeMap,
					Buffer.from(expectedBuffer, 'hex')
				)
				expect(instance).toEqual(values)
				expect(remainingBuffer.length).toBe(0)
			})
		})

		describe('tiny empty', () => {
			const { typeMap, values } = demoNumberMap(1, true)
			const expectedBuffer = '0000'

			it('converts values to buffer', () => {
				const buffer = BufferHelper.numberMapToBuffer(
					typeMap,
					values
				)
				expect(buffer.toString('hex')).toEqual(expectedBuffer)
			})

			it('converts buffer to values', () => {
				const {
					instance,
					remainingBuffer
				} = BufferHelper.numberMapFromBuffer(
					typeMap,
					Buffer.from(expectedBuffer, 'hex')
				)
				expect(instance).toEqual(values)
				expect(remainingBuffer.length).toBe(0)
			})
		})

		describe('fractioned', () => {
			const typeMap: Record<string, PrimitiveBufferTypes.UInt | PrimitiveBufferTypes.Double> = {}
			const values: Record<string, number> = {}

			for (let i = 1; i < 101; i++) {
				typeMap[i.toString()] = PrimitiveBufferTypes.UInt
				values[i.toString()] = 0
			}
			values['100'] = 1

			const expectedBuffer = '008000800080008000800080000201000000'

			it('converts values to buffer', () => {
				const buffer = BufferHelper.numberMapToBuffer(
					typeMap,
					values
				)
				expect(buffer.toString('hex')).toEqual(expectedBuffer)
			})

			it('converts buffer to values', () => {
				const {
					instance,
					remainingBuffer
				} = BufferHelper.numberMapFromBuffer(
					typeMap,
					Buffer.from(expectedBuffer, 'hex')
				)
				expect(instance).toEqual(values)
				expect(remainingBuffer.length).toBe(0)
			})
		})
	})
})