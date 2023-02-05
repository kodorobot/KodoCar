/**
* 使用這個文件來定義自訂的函式和積木。
* 進一步了解：https://makecode.microbit.org/blocks/custom
*/

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
//% weight=100 color=#dd7b34 icon="" block="麥昆"
namespace KodoCar {
    //% block="馬達 %lr 方向 %fb 速度 %speed"
    //% speed.min=0 speed.max=255 speed.defl=50
    export function motor(lr: leftRight, fb: forwardBack, speed: number): void {
        const motorList: AnalogPin[] = [AnalogPin.P7, AnalogPin.P6, AnalogPin.P13, AnalogPin.P14]
        let i = 0
        if (lr) i += 2
        if (fb) i += 1
        pins.analogWritePin(motorList[i], speed * 4)
    }

    //% block="LED燈 %lr %on"
    export function led(lr: leftRight, on: onoff): void {
        let pinId: DigitalPin = DigitalPin.P3
        if (lr) pinId = DigitalPin.P9
        pins.digitalWritePin(pinId, on)
    }

    //% block="馬達停止 %lr"
    export function motorStop(lr: leftRightAll): void {
        if (lr == 1) {
            pins.analogWritePin(AnalogPin.P6, 0)
            pins.analogWritePin(AnalogPin.P7, 0)
        } else if (lr == 2) {
            pins.analogWritePin(AnalogPin.P14, 0)
            pins.analogWritePin(AnalogPin.P13, 0)
        } else {
            pins.analogWritePin(AnalogPin.P6, 0)
            pins.analogWritePin(AnalogPin.P7, 0)
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
        let v = 0;
        switch (lrm) {
            case 0:
                v = pins.analogReadPin(AnalogPin.P10)
                break
            case 1:
                v = pins.analogReadPin(AnalogPin.P16)
                break
            case 2:
                v = pins.analogReadPin(AnalogPin.P12)
                break
        }
        return v
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
}