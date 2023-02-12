/**
* 使用這個文件來定義自訂的函式和積木。
* 進一步了解：https://makecode.microbit.org/blocks/custom
*/
const enum IrButton {
    //% block="any"
    Any = -1,
    //% block="▲"
    Up = 0x62,
    //% block=" "
    Unused_2 = -2,
    //% block="◀"
    Left = 0x22,
    //% block="OK"
    Ok = 0x02,
    //% block="▶"
    Right = 0xc2,
    //% block=" "
    Unused_3 = -3,
    //% block="▼"
    Down = 0xa8,
    //% block=" "
    Unused_4 = -4,
    //% block="1"
    Number_1 = 0x68,
    //% block="2"
    Number_2 = 0x98,
    //% block="3"
    Number_3 = 0xb0,
    //% block="4"
    Number_4 = 0x30,
    //% block="5"
    Number_5 = 0x18,
    //% block="6"
    Number_6 = 0x7a,
    //% block="7"
    Number_7 = 0x10,
    //% block="8"
    Number_8 = 0x38,
    //% block="9"
    Number_9 = 0x5a,
    //% block="*"
    Star = 0x42,
    //% block="0"
    Number_0 = 0x4a,
    //% block="#"
    Hash = 0x52,
}

const enum IrButtonAction {
    //% block="pressed"
    Pressed = 0,
    //% block="released"
    Released = 1,
}

const enum IrProtocol {
    //% block="Keyestudio"
    Keyestudio = 0,
    //% block="NEC"
    NEC = 1,
}


enum PingUnit {
    //% block="公分"
    Centimeters,
    //% block="微米"
    MicroSeconds
}

enum leftRight {
    //% block="左側"
    left,
    //% block="右側"
    right
}

enum leftRightMid {
    //% block="左側"
    left,
    //% block="右側"
    right,
    //% block="中間"
    mid
}

enum leftRightAll {
    //% block="左側"
    left,
    //% block="右側"
    right,
    //% block="全部"
    all
}

enum forwardBack {
    //% block="前進"
    forward,
    //% block="後退"
    back
}

enum onoff {
    //% block="開"
    on,
    //% block="關"
    off
}

enum servoPin {
    //% block="P0"
    P0,
    //% block="P2"
    P2,
    //% block="P4"
    P4
}


/**
 * Custom blocks
 */
//% weight=100 color=#dd7b34 icon="" block="KodoCar"
namespace KodoCar {
    //% block="馬達 %lr 方向 %fb 速度 %speed"
    //% speed.min=0 speed.max=255 speed.defl=50
    export function motor(lr: leftRight, fb: forwardBack, speed: number): void {
        const motorList: AnalogPin[] = [AnalogPin.P13, AnalogPin.P14, AnalogPin.P6, AnalogPin.P7 ]
        let i = 0
        if (lr) i += 2
        if (fb) i += 1
        pins.analogWritePin(motorList[i], speed * 4)
    }

    //% block="LED燈 %lr %on"
    export function led(lr: leftRight, on: onoff): void {
        let pinId: DigitalPin = DigitalPin.P9
        if (lr==1) pinId = DigitalPin.P3
        
        pins.digitalWritePin(pinId, Math.abs(on - 1))
    }

    //% block="馬達停止 %lr"
    export function motorStop(lr: leftRightAll): void {
        if (lr == 0) {
            pins.analogWritePin(AnalogPin.P14, 0)
            pins.analogWritePin(AnalogPin.P13, 0)
        } else if (lr == 1) {
            pins.analogWritePin(AnalogPin.P6, 0)
            pins.analogWritePin(AnalogPin.P7, 0)
            pins.digitalWritePin(DigitalPin.P9, 1)
        } else {
            pins.analogWritePin(AnalogPin.P7, 0)
            pins.analogWritePin(AnalogPin.P6, 0)
            pins.analogWritePin(AnalogPin.P13, 0)
            pins.analogWritePin(AnalogPin.P14, 0)
        }
    }

    //% block="舵機 %pin 角度 %angle"
    //% angle.min=0 angle.max=180 angle.defl=90
    export function servo(pin: servoPin, angle: number): void {
        switch (pin) {
            case 0:
                pins.servoWritePin(AnalogPin.P0, angle)
                break
            case 1:
                pins.servoWritePin(AnalogPin.P2, angle)
                break
            case 2:
                pins.servoWritePin(AnalogPin.P4, angle)
                break
        }
    }

    //% block="巡線感測器 %lrm"
    export function line(lrm: leftRightMid): number {
        let pin;
        switch (lrm) {
            case 0:
                pin =AnalogPin.P16
                break
            case 1:
                pin =AnalogPin.P12
                break
            case 2:
                pin = AnalogPin.P10
                break
        }
        
        return pins.analogReadPin(pin)
    }

    //% block="超音波距離 %unit"
    export function Ultrasonic(unit: PingUnit, maxCmDistance = 500): number {
        let d
        let echo = DigitalPin.P8
        let trig = DigitalPin.P1
        pins.digitalWritePin(trig, 0);
        if (pins.digitalReadPin(echo) == 0) {
            pins.digitalWritePin(trig, 1);
            pins.digitalWritePin(trig, 0);
            d = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);
        } else {
            pins.digitalWritePin(trig, 0);
            pins.digitalWritePin(trig, 1);
            d = pins.pulseIn(echo, PulseValue.Low, maxCmDistance * 58);
        }
        let x = d / 39;
        if (x <= 0 || x > 500) {
            return 0;
        }
        switch (unit) {
            case PingUnit.Centimeters: return Math.round(x);
            default: return Math.idiv(d, 2.54);
        }

    }

    let irState: IrState;

    const IR_REPEAT = 256;
    const IR_INCOMPLETE = 257;
    const IR_DATAGRAM = 258;

    const REPEAT_TIMEOUT_MS = 120;

    interface IrState {
        protocol: IrProtocol;
        hasNewDatagram: boolean;
        bitsReceived: uint8;
        addressSectionBits: uint16;
        commandSectionBits: uint16;
        hiword: uint16;
        loword: uint16;
        activeCommand: number;
        repeatTimeout: number;
        onIrButtonPressed: IrButtonHandler[];
        onIrButtonReleased: IrButtonHandler[];
        onIrDatagram: () => void;
    }
    class IrButtonHandler {
        irButton: IrButton;
        onEvent: () => void;

        constructor(
            irButton: IrButton,
            onEvent: () => void
        ) {
            this.irButton = irButton;
            this.onEvent = onEvent;
        }
    }


    function appendBitToDatagram(bit: number): number {
        irState.bitsReceived += 1;

        if (irState.bitsReceived <= 8) {
            irState.hiword = (irState.hiword << 1) + bit;
            if (irState.protocol === IrProtocol.Keyestudio && bit === 1) {
                // recover from missing message bits at the beginning
                // Keyestudio address is 0 and thus missing bits can be detected
                // by checking for the first inverse address bit (which is a 1)
                irState.bitsReceived = 9;
                irState.hiword = 1;
            }
        } else if (irState.bitsReceived <= 16) {
            irState.hiword = (irState.hiword << 1) + bit;
        } else if (irState.bitsReceived <= 32) {
            irState.loword = (irState.loword << 1) + bit;
        }

        if (irState.bitsReceived === 32) {
            irState.addressSectionBits = irState.hiword & 0xffff;
            irState.commandSectionBits = irState.loword & 0xffff;
            return IR_DATAGRAM;
        } else {
            return IR_INCOMPLETE;
        }
    }

    function decode(markAndSpace: number): number {
        if (markAndSpace < 1600) {
            // low bit
            return appendBitToDatagram(0);
        } else if (markAndSpace < 2700) {
            // high bit
            return appendBitToDatagram(1);
        }

        irState.bitsReceived = 0;

        if (markAndSpace < 12500) {
            // Repeat detected
            return IR_REPEAT;
        } else if (markAndSpace < 14500) {
            // Start detected
            return IR_INCOMPLETE;
        } else {
            return IR_INCOMPLETE;
        }
    }

    function enableIrMarkSpaceDetection(pin: DigitalPin) {
        pins.setPull(pin, PinPullMode.PullNone);

        let mark = 0;
        let space = 0;

        pins.onPulsed(pin, PulseValue.Low, () => {
            // HIGH, see https://github.com/microsoft/pxt-microbit/issues/1416
            mark = pins.pulseDuration();
        });

        pins.onPulsed(pin, PulseValue.High, () => {
            // LOW
            space = pins.pulseDuration();
            const status = decode(mark + space);

            if (status !== IR_INCOMPLETE) {
                handleIrEvent(status);
            }
        });
    }

    function handleIrEvent(irEvent: number) {

        // Refresh repeat timer
        if (irEvent === IR_DATAGRAM || irEvent === IR_REPEAT) {
            irState.repeatTimeout = input.runningTime() + REPEAT_TIMEOUT_MS;
        }

        if (irEvent === IR_DATAGRAM) {
            irState.hasNewDatagram = true;

            if (irState.onIrDatagram) {
                background.schedule(irState.onIrDatagram, background.Thread.UserCallback, background.Mode.Once, 0);
            }

            const newCommand = irState.commandSectionBits >> 8;

            // Process a new command
            if (newCommand !== irState.activeCommand) {

                if (irState.activeCommand >= 0) {
                    const releasedHandler = irState.onIrButtonReleased.find(h => h.irButton === irState.activeCommand || IrButton.Any === h.irButton);
                    if (releasedHandler) {
                        background.schedule(releasedHandler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                    }
                }

                const pressedHandler = irState.onIrButtonPressed.find(h => h.irButton === newCommand || IrButton.Any === h.irButton);
                if (pressedHandler) {
                    background.schedule(pressedHandler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                }

                irState.activeCommand = newCommand;
            }
        }
    }

    function initIrState() {
        if (irState) {
            return;
        }

        irState = {
            protocol: undefined,
            bitsReceived: 0,
            hasNewDatagram: false,
            addressSectionBits: 0,
            commandSectionBits: 0,
            hiword: 0, // TODO replace with uint32
            loword: 0,
            activeCommand: -1,
            repeatTimeout: 0,
            onIrButtonPressed: [],
            onIrButtonReleased: [],
            onIrDatagram: undefined,
        };
    }

    /**
     * Connects to the IR receiver module at the specified pin and configures the IR protocol.
     * @param pin IR receiver pin, eg: DigitalPin.P0
     * @param protocol IR protocol, eg: IrProtocol.Keyestudio
     */
    //% subcategory="紅外線接收器"
    //% blockId="makerbit_infrared_connect_receiver"
    //% block="紅外線接收器 腳位%pin 解碼%protocol"
    //% pin.fieldEditor="gridpicker"
    //% pin.fieldOptions.columns=4
    //% pin.fieldOptions.tooltips="false"
    //% pin.defl=DigitalPin.P5
    //% weight=90
    export function connectIrReceiver(
        pin: DigitalPin,
        protocol: IrProtocol
    ): void {
        initIrState();

        if (irState.protocol) {
            return;
        }

        irState.protocol = protocol;

        enableIrMarkSpaceDetection(pin);

        background.schedule(notifyIrEvents, background.Thread.Priority, background.Mode.Repeat, REPEAT_TIMEOUT_MS);
    }

    function notifyIrEvents() {
        if (irState.activeCommand === -1) {
            // skip to save CPU cylces
        } else {
            const now = input.runningTime();
            if (now > irState.repeatTimeout) {
                // repeat timed out

                const handler = irState.onIrButtonReleased.find(h => h.irButton === irState.activeCommand || IrButton.Any === h.irButton);
                if (handler) {
                    background.schedule(handler.onEvent, background.Thread.UserCallback, background.Mode.Once, 0);
                }

                irState.bitsReceived = 0;
                irState.activeCommand = -1;
            }
        }
    }

    /**
     * Do something when an IR datagram is received.
     * @param handler body code to run when the event is raised
     */
    //% subcategory="紅外線接收器"
    //% blockId=makerbit_infrared_on_ir_datagram
    //% block="當收到紅外線資料"
    //% weight=40
    export function onIrDatagram(handler: () => void) {
        initIrState();
        irState.onIrDatagram = handler;
    }

    /**
     * Returns the IR datagram as 32-bit hexadecimal string.
     * The last received datagram is returned or "0x00000000" if no data has been received yet.
     */
    //% subcategory="紅外線接收器"
    //% blockId=makerbit_infrared_ir_datagram
    //% block="讀取紅外線資料"
    //% weight=30
    export function irDatagram(): string {
        basic.pause(0); // Yield to support background processing when called in tight loops
        initIrState();
        return (
            "0x" +
            ir_rec_to16BitHex(irState.addressSectionBits) +
            ir_rec_to16BitHex(irState.commandSectionBits)
        );
    }

    /**
     * Returns true if any IR data was received since the last call of this function. False otherwise.
     */
    //% subcategory="紅外線接收器"
    //% blockId=makerbit_infrared_was_any_ir_datagram_received
    //% block="接收到紅外線資料"
    //% weight=80
    export function wasIrDataReceived(): boolean {
        basic.pause(0); // Yield to support background processing when called in tight loops
        initIrState();
        if (irState.hasNewDatagram) {
            irState.hasNewDatagram = false;
            return true;
        } else {
            return false;
        }
    }

    function ir_rec_to16BitHex(value: number): string {
        let hex = "";
        for (let pos = 0; pos < 4; pos++) {
            let remainder = value % 16;
            if (remainder < 10) {
                hex = remainder.toString() + hex;
            } else {
                hex = String.fromCharCode(55 + remainder) + hex;
            }
            value = Math.idiv(value, 16);
        }
        return hex;
    }
}