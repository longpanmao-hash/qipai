export class ByteBuf {
  private view: DataView;
  private readOffset = 0;
  private writeOffset = 0;

  public constructor(private buf: ArrayBuffer = new ArrayBuffer(128)) {
    this.view = new DataView(this.buf);
  }

  public static wrap(buffer: ArrayBuffer): ByteBuf {
    const b = new ByteBuf(buffer);
    b.writeOffset = buffer.byteLength;
    return b;
  }

  public writeU16(v: number): void {
    this.ensure(2);
    this.view.setUint16(this.writeOffset, v);
    this.writeOffset += 2;
  }

  public writeU32(v: number): void {
    this.ensure(4);
    this.view.setUint32(this.writeOffset, v);
    this.writeOffset += 4;
  }

  public writeBytes(bytes: Uint8Array): void {
    this.ensure(bytes.length);
    new Uint8Array(this.buf, this.writeOffset, bytes.length).set(bytes);
    this.writeOffset += bytes.length;
  }

  public readU16(): number {
    const v = this.view.getUint16(this.readOffset);
    this.readOffset += 2;
    return v;
  }

  public readU32(): number {
    const v = this.view.getUint32(this.readOffset);
    this.readOffset += 4;
    return v;
  }

  public readBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(this.buf.slice(this.readOffset, this.readOffset + length));
    this.readOffset += length;
    return bytes;
  }

  public remaining(): number {
    return this.writeOffset - this.readOffset;
  }

  public toArrayBuffer(): ArrayBuffer {
    return this.buf.slice(0, this.writeOffset);
  }

  private ensure(size: number): void {
    if (this.writeOffset + size <= this.buf.byteLength) return;
    let newSize = this.buf.byteLength;
    while (newSize < this.writeOffset + size) newSize *= 2;
    const next = new ArrayBuffer(newSize);
    new Uint8Array(next).set(new Uint8Array(this.buf));
    this.buf = next;
    this.view = new DataView(this.buf);
  }
}
