KodoCar.connectIrReceiver(DigitalPin.P5, IrProtocol.NEC)
basic.forever(function () {
    if (KodoCar.wasIrDataReceived()) {
        serial.writeLine(KodoCar.irDatagram())
    }
})
