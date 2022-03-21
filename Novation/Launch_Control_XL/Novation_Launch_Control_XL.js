// ============================================================================================
// Cubase / Nuendo 12+ Integration for Novation LaunchControl XL
// V0.1 ALPHA - Written by: @Oqion staochastic@oqion.com 
// With guidence from: @Skijumptoes, @MarcoE, @Jochen_Trappe and the Cubase Forum Community
//
// This software is not sactioned or approved by Steinberg - Use at your own risk.
// ============================================================================================
// This program is free software: you can redistribute it and/or modify it under the terms of the 
// GNU General Public License as published by the Free Software Foundation, either version 3 of the 
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with this program. 
// If not, see <https://www.gnu.org/licenses/>.
// ============================================================================================
//
// To simplify this script The LCXL_OQ.sysx should be loaded to 
// user preset 8. 
// Set the device to Factory 8 for Mackie HUI, 
// and when on the "Mixer" page the Quick Controlls will still work.
// MIDI Channel is hard coded to 16 with the CCs also hard coded.
// The top 8 knobs are set to the same as they would be in Mackie HUI mode so
// that they still work when in that mode through the regualar port (Not the HUI port)
// The HUI port is still free.
// 
// Do to limitations in Cubase this script instance will only work with one Launch Control at a time.
// However, if you >> duplicate the script << in another directory and change the 'expectedName'
// it can be used with more than one. Changing the expected name should pick the non HUI
// port matching. This can also be done to have it only connect to that one LCXL.
//
// For instance if the LCXL shows up as "2- Launch Control XL" this script will still work.
// The '2' is dertmined by the USB port.
//
// But if you have 2 units and duplicate this script in a second directory and change the
// >>expectedName<< to say "3- Launch Control XL" it will work.
// Then the pages layout on the second can be changed, or left the same, or whatever.
//
// The line below will need to be deleted from the generated JavaScript.
// TODO: 1 Figure out why this is the case and fix it do get compleation to work properly
// and avoid manualy editing the JS.
// This seems to have something to do with the way the Cubase TypeScript exports.
// 2 Cubase can be abstracted out to a Host Class with event registration. 3 Maybe Apply Typing.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
// ============================================================================================
//-----------------------------------------------------------------------------
// 0. DRIVER SETUP - create driver object and detection information
//-----------------------------------------------------------------------------
// get the api's entry point - This like will show as an error, but still works
// import midiremote_api from 'midiremote_api_v1';
/// <reference path="../apiforts/midiremote_api_v1.d.ts" />
// To enable type compleation
//import midiremote_api = require('midiremote_api_v1');
// To enable transpiling
var midiremote_api = require('midiremote_api_v1');
var expectedName = "Launch Control XL";
// create the device driver main object
var deviceDriver = midiremote_api.makeDeviceDriver('Novation', expectedName, 'Oqion');
//-----------------------------------------------------------------------------
//  Macros
// Does it log? Can't seem to attache the debuger. Since we still have the issue
// with the imports the console here reduces the error to one place in the code.
var doesLog = true;
var LOG = function (logString) {
    if (doesLog) {
        // this line will show as an error. But still works.
        console.log(logString);
    }
};
//-----------------------------------------------------------------------------
// 1. Launch Control - Hardware Class
//-----------------------------------------------------------------------------
var LaunchControlXL = /** @class */ (function () {
    function LaunchControlXL(deviceDriver, name) {
        this.MIDIIn = deviceDriver.mPorts.makeMidiInput();
        ;
        this.MIDIOut = deviceDriver.mPorts.makeMidiOutput();
        deviceDriver
            .makeDetectionUnit()
            .detectPortPair(this.MIDIIn, this.MIDIOut)
            .expectOutputNameEndsWith(name)
            .expectInputNameEndsWith(name);
        this.MIDIChannel = 0x0F;
    }
    // Resets all of the the template
    LaunchControlXL.prototype._initReset = function (activeDevice) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsReset);
    };
    // Sets the template to user 8
    LaunchControlXL.prototype._initTemplate = function (activeDevice) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._TemplateSet);
    };
    // allow lights to be set to flashing colours
    LaunchControlXL.prototype._initFlash = function (activeDevice) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsFlashEnable);
    };
    // dissallow lights to be set to flashing colours
    LaunchControlXL.prototype._initFlashDissable = function (activeDevice) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsFalshOff);
    };
    // Turn all the LEDs to the highest they will go
    LaunchControlXL.prototype.setAllHigh = function (activeDevice) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsAllHigh);
    };
    // Turn all the LEDs to  medium
    LaunchControlXL.prototype.setAllMed = function (activeDevice) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsAllMedium);
    };
    // Turn all the LEDs to  low
    LaunchControlXL.prototype.setAllLow = function (activeDevice) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsAllLow);
    };
    // TODO: Not sure if the buggering can chang ethe ON colour of a button.
    // Seems like it should work, but the buttons are allways full on (so yellow)
    // this might be do to the host sending 127 and the device responsing
    // as if it were a colour message (as it does). If that is the porblem
    // then the host must be sending the 127 after the note colour message
    // is sent.
    // The Launch Control LX can buffer LED changes and swap them all at once.
    // it has two buffers and writes and displays them interchangably.
    // this method enters that mode
    LaunchControlXL.prototype.bufferingStart = function (activeDevice) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsBufferStart);
    };
    // The Launch Control LX can buffer LED changes and swap them all at once.
    // it has two buffers and writes and displays them interchangably.
    // this method flips which buffer is being displayed and written to.
    LaunchControlXL.prototype.bufferingFlip = function (activeDevice) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsBufferFlip);
    };
    // The Launch Control LX can buffer LED changes and swap them all at once.
    // it has two buffers and writes and displays them interchangably.
    // this method exits that mode
    LaunchControlXL.prototype.bufferingStop = function (activeDevice) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsBufferStop);
    };
    // Set the toggle state of a button to ON IFF it is set to toggle, which it isn't in the default sysex
    LaunchControlXL.prototype.setButtonToggleOn = function (activeDevice, encoderAddress) {
        // sending this message causes Cubase to Hang 
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._EncoderToggleStatePrefix.concat([encoderAddress, LaunchControlXL._ToggleOn, LaunchControlXL._MessageEnd]));
    };
    // Set the toggle state of a button to OFF IFF it is set to toggle, which it isn't in the default sysex
    LaunchControlXL.prototype.setButtonToggleOff = function (activeDevice, encoderAddress) {
        // sending this message causes Cubase to Hang 
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._EncoderToggleStatePrefix.concat([encoderAddress, LaunchControlXL._ToggleOff, LaunchControlXL._MessageEnd]));
    };
    //9nh, Note, Velocity
    // Sets the LED colour of a specific widget (Knob or Button)
    LaunchControlXL.prototype.setEncoderColour = function (activeDevice, encoderAddress, colour) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._EncoderSetLEDPrefix.concat([encoderAddress, colour, LaunchControlXL._MessageEnd]));
    };
    LaunchControlXL.prototype.setOff = function (activeDevice, encoderAddress) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._EncoderSetLEDPrefix.concat([encoderAddress, LaunchControlXL.Colour.Off, LaunchControlXL._MessageEnd]));
    };
    // Sets the LED colour of a specific widget (Knob or Button)
    LaunchControlXL.prototype.setEncoderColourByNote = function (activeDevice, CC, colour) {
        this.MIDIOut.sendMidi(activeDevice, this.MIDIChannel, CC, colour);
    };
    // Takes a map of all of the widgets and set's the colours accordingly.
    LaunchControlXL.prototype.setColourMap = function (activeDevice, colourMap) {
        for (var i = 0; i < 8; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsTop[i], colourMap.KnobsTop[i]);
        }
        for (var i = 0; i < 8; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsMiddle[i], colourMap.KnobsMiddle[i]);
        }
        for (var i = 0; i < 8; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsBottom[i], colourMap.KnobsBottom[i]);
        }
        for (var i = 0; i < 8; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonsTop[i], colourMap.ButtonsTop[i]);
        }
        for (var i = 0; i < 8; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonsBottom[i], colourMap.ButtonsBottom[i]);
        }
        for (var i = 0; i < 4; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonsSide[i], colourMap.ButtonsSide[i]);
        }
        this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonUp, colourMap.Up);
        this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonDown, colourMap.Down);
        this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonLeft, colourMap.Left);
        this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonRight, colourMap.Right);
    };
    // sets the upper LEFT 8 knob colours from an array of 8. Usefull when using Quick Controls in 
    // 2x4 groups rather than 1x8 line.
    LaunchControlXL.prototype.setUpperKnobsLeft = function (activeDevice, colourArray) {
        for (var i = 0; i < 4; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsTop[i], colourArray.KnobsTop[i]);
        }
        for (var i = 0; i < 4; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsMiddle[i], colourArray.KnobsMiddle[3 + i]);
        }
    };
    // sets the upper RIGHT 8 knob colours from an array of 8. Usefull when using Quick Controls in 
    // 2x4 groups rather than 1x8 line.
    LaunchControlXL.prototype.setUpperKnobsRight = function (activeDevice, colourArray) {
        for (var i = 0; i < 4; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsTop[3 + i], colourArray.KnobsTop[i]);
        }
        for (var i = 0; i < 4; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsMiddle[3 + i], colourArray.KnobsMiddle[3 + i]);
        }
    };
    // Initialize the state of the Launch XOntrol XL so that it is on the correct template
    // and all of the lights are on.
    LaunchControlXL.prototype.initialize = function (activeDevice) {
        this._initTemplate(activeDevice);
        this._initReset(activeDevice);
        // this.setColourMap(activeDevice, LaunchControlXL._InitialColours);
        this.bufferingStop(activeDevice);
        this._initFlashDissable(activeDevice);
    };
    LaunchControlXL.prototype.getMidiBindings = function () {
        var midiMap = [];
        function pushCC(CC) {
            midiMap.push({ type: 'CC', value: CC });
        }
        var cc = LaunchControlXL.CC;
        cc.KnobsTop.forEach(pushCC);
        cc.KnobsMiddle.forEach(pushCC);
        cc.KnobsBottom.forEach(pushCC);
        cc.Fader.forEach(pushCC);
        cc.ButtonsTop.forEach(pushCC);
        cc.ButtonsBottom.forEach(pushCC);
        cc.ButtonsSide.forEach(pushCC);
        midiMap.push(cc.ButtonUp);
        midiMap.push(cc.ButtonDown);
        midiMap.push(cc.ButtonLeft);
        midiMap.push(cc.ButtonRight);
    };
    LaunchControlXL.prototype.makeKnob = function (address, cc, row, column) {
        return new LCXLKnob(this, address, cc, row, column);
    };
    LaunchControlXL.prototype.makeFader = function (address, cc, row, column) {
        return new LCXLFader(this, address, cc, row, column);
    };
    LaunchControlXL.prototype.makeButton = function (address, cc, row, column) {
        return new LCXLButton(this, address, cc, row, column);
    };
    LaunchControlXL.prototype.makeDirectionButton = function (address, cc, row, column) {
        return new LCXLDirectionButton(this, address, cc, row, column);
    };
    LaunchControlXL.prototype.makeSideButton = function (address, cc, row) {
        return new LCXLSideButton(this, address, cc, row);
    };
    // TODO: Make this so that it can make more than one with a different MIDI Channel and screen position
    // need to respond to Bank change message 
    // need to configure screen position
    // Need to make 7 more sysex, and also save them to send to the device. 8-14
    // That way multiple user templates could be used at the same time.
    // Figure out if the syx can be sent directly from this script. MR can do that
    // but Novation has some special way it has to be done.
    LaunchControlXL.prototype.makeEncoders = function (surface) {
        return new LCXLEncoders(this, surface);
    };
    var _a;
    _a = LaunchControlXL;
    LaunchControlXL._SystemTemplate = 0xB7;
    LaunchControlXL._Template = 0x07;
    LaunchControlXL._LightsReset = [_a._SystemTemplate, 0x00, 0x00];
    // Enable System flashing.
    LaunchControlXL._LightsFlashEnable = [_a._SystemTemplate, 0x00, 0x28];
    // System Buffering mutualy exclusive with System Flashing Mode
    LaunchControlXL._LightsBufferStart = [_a._SystemTemplate, 0x00, 0x31];
    LaunchControlXL._LightsBufferFlip = [_a._SystemTemplate, 0x00, 0x34];
    LaunchControlXL._LightsBufferStop = [_a._SystemTemplate, 0x00, 0x30];
    // Direct instintanious control of flash on or off.
    LaunchControlXL._LightsFalshOn = [_a._SystemTemplate, 0x00, 0x20];
    LaunchControlXL._LightsFalshOff = [_a._SystemTemplate, 0x00, 0x21];
    // All lights
    LaunchControlXL._LightsAllHigh = [_a._SystemTemplate, 0x00, 0x7F];
    LaunchControlXL._LightsAllMedium = [_a._SystemTemplate, 0x00, 0x7E];
    LaunchControlXL._LightsAllLow = [_a._SystemTemplate, 0x00, 0x7D];
    LaunchControlXL._SystemPrefix = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x11];
    LaunchControlXL._EncoderSetLEDPrefix = _a._SystemPrefix.concat([0x78, _a._Template]);
    LaunchControlXL._EncoderToggleStatePrefix = _a._SystemPrefix.concat([0x7B, _a._Template]);
    LaunchControlXL._ToggleOn = 0x7F;
    LaunchControlXL._ToggleOff = 0x00;
    LaunchControlXL._MessageEnd = 0xF7;
    LaunchControlXL._TemplateSet = _a._SystemPrefix.concat([0x77, _a._Template, _a._MessageEnd]);
    // Use these to address the LCXLs Launchpad interface with the included sysex.
    // place that sysex on user template 8
    // these are also the note addresses for chaning the colours if Launchpad interface is used
    // it is not in this code.
    LaunchControlXL.CC = {
        KnobsTop: [0x0D, 0x0E, 0x0F, 0x10, 0x11, 0x12, 0x13, 0x14],
        KnobsMiddle: [0x1D, 0x1E, 0x1F, 0x20, 0x21, 0x22, 0x23, 0x24],
        KnobsBottom: [0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C],
        Fader: [0x2D, 0x2E, 0x2F, 0x30, 0x31, 0x32, 0x33, 0x34],
        ButtonsTop: [0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C],
        ButtonsBottom: [0x3D, 0x3E, 0x3F, 0x40, 0x41, 0x42, 0x43, 0x44],
        ButtonsSide: [0x19, 0x1A, 0x1B, 0x1C],
        ButtonUp: 0x15,
        ButtonDown: 0x16,
        ButtonLeft: 0x17,
        ButtonRight: 0x18,
    };
    // These allow for the setting of LEDs to the secified colour.
    LaunchControlXL.Colour = {
        Off: 0x0C,
        RedLow: 0x0D,
        RedMed: 0x0E,
        RedHigh: 0x0F,
        RedFlash: 0x0B,
        AmberLow: 0x2E,
        AmberHigh: 0x3F,
        AmberFlash: 0x3B,
        OrangeLow: 0x1E,
        OrangeMed: 0x2F,
        OrangeHigh: 0x1F,
        OrangeFlash: 0x1B,
        GreenLow: 0x1C,
        GreenMed: 0x2C,
        GreenHigh: 0x3C,
        GreenFlash: 0x38,
        Lime: 0x3D,
        LimeFlash: 0x39,
        YellowLow: 0x1D,
        YellowMed: 0x2D,
        YellowHigh: 0x3E,
        YellowFlash: 0x3A
    };
    // When doing direct system addressing the template can be specified.
    // On Cubase we have pages, so this is not likely to be neccisary.
    LaunchControlXL.Template = {
        user1: 0x00,
        user2: 0x01,
        user3: 0x02,
        user4: 0x03,
        user5: 0x04,
        user6: 0x05,
        user7: 0x06,
        user8: 0x07,
        factory1: 0x08,
        factory2: 0x09,
        factory3: 0x0A,
        factory4: 0x0B,
        factory5: 0x0C,
        factory6: 0x0D,
        factory7: 0x0E,
        factory8: 0x0F,
    };
    // Use these to address the controls directly using the template ID.
    LaunchControlXL.EncoderAddress = {
        KnobsTop: [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07],
        KnobsMiddle: [0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F],
        KnobsBottom: [0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17],
        Fader: [0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F],
        ButtonsTop: [0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F],
        ButtonsBottom: [0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27],
        ButtonsSide: [0x28, 0x29, 0x2A, 0x2B],
        ButtonUp: 0x2C,
        ButtonDown: 0x2D,
        ButtonLeft: 0x2E,
        ButtonRight: 0x2F,
    };
    return LaunchControlXL;
}());
var Red = { high: LaunchControlXL.Colour.RedHigh,
    med: LaunchControlXL.Colour.RedMed,
    low: LaunchControlXL.Colour.RedLow,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.RedFlash,
};
var Green = { high: LaunchControlXL.Colour.GreenHigh,
    med: LaunchControlXL.Colour.GreenMed,
    low: LaunchControlXL.Colour.GreenLow,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.GreenFlash,
};
var Yellow = { high: LaunchControlXL.Colour.YellowHigh,
    med: LaunchControlXL.Colour.YellowMed,
    low: LaunchControlXL.Colour.YellowLow,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.YellowFlash,
};
var Amber = { high: LaunchControlXL.Colour.AmberHigh,
    med: LaunchControlXL.Colour.AmberLow,
    low: LaunchControlXL.Colour.AmberLow,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.AmberFlash,
};
var Orange = { high: LaunchControlXL.Colour.OrangeHigh,
    med: LaunchControlXL.Colour.OrangeLow,
    low: LaunchControlXL.Colour.OrangeLow,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.OrangeFlash,
};
var Lime = { high: LaunchControlXL.Colour.Lime,
    med: LaunchControlXL.Colour.Lime,
    low: LaunchControlXL.Colour.Lime,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.LimeFlash,
};
var Inactive = { high: LaunchControlXL.Colour.Off,
    med: LaunchControlXL.Colour.Off,
    low: LaunchControlXL.Colour.Off,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.Off,
};
//-----------------------------------------------------------------------------
// 2. Launch Control - Encoders
//-----------------------------------------------------------------------------
// So... it turns out the events are not per-page as expected, they are per element, but not really.
// And making a different new element doesn't help. It is actualy per midi CC or Note type.
// So making another instance of an encoder (or element) doesn't help.
// Only the last one set is called. This means that if you have more than one
// Page the registration overwrites the previous one. So this  is 
// a workaround for that. 
// Tried setting a global variable to control it, but that didn't work.
// So we will have to pass it the page all the way down from the Page
// through the Controller, to the Encoder, every time the page changes.
// Only allowing one registration per page per encoder per event.
var EventManager = /** @class */ (function () {
    function EventManager(pagename) {
        this.pagename = pagename;
        this.functorEventDisplayValueChange = null;
        this.functorEventHostTitle = null;
        this.functorEventProcessValueChange = null;
    }
    return EventManager;
}());
var LCXLEncoderAbstract = /** @class */ (function () {
    function LCXLEncoderAbstract(device, address, cc, width, height, row, column) {
        this.width = width;
        this.height = height;
        this.row = row;
        this.column = column;
        this.address = address;
        this.cc = cc;
        this.device = device;
        this.eventManagers = {};
        this.eventDisplayValueChangeRegistered = false;
        this.eventHostTitleRegistered = false;
        this.eventProcessValueChangeRegistered = false;
        this.currentpage = "";
    }
    LCXLEncoderAbstract.prototype.setColour = function (activeDevice, colour) {
        this.device.setEncoderColour(activeDevice, this.address, colour);
        //this.device.setEncoderColourByNote(activeDevice, this.cc, colour)
    };
    LCXLEncoderAbstract.prototype.turnOff = function (activeDevice) {
        this.device.setOff(activeDevice, this.address);
    };
    LCXLEncoderAbstract.prototype.initSurface = function (surface) {
        this.element = this.makeElement(surface, this.column, this.row);
        this.element.mSurfaceValue.mMidiBinding
            .setInputPort(this.device.MIDIIn)
            .setOutputPort(this.device.MIDIOut)
            .bindToControlChange(this.device.MIDIChannel, this.cc);
    };
    // Will also set a variable to control it. Only allowing
    // one per page per encoder, overwriting if already registered.
    LCXLEncoderAbstract.prototype.resetPage = function (name) {
        this.currentpage = name;
    };
    LCXLEncoderAbstract.prototype._getEventManager = function (pageName) {
        var eventManager = this.eventManagers[pageName];
        var isUndefined = "" + typeof eventManager;
        if (isUndefined == "undefined") {
            return null;
        }
        return eventManager;
    };
    LCXLEncoderAbstract.prototype._makeEventManagerIfNeeded = function (pageName) {
        var eventManager = this._getEventManager(pageName);
        if (null == eventManager) {
            eventManager = new EventManager(pageName);
            this.eventManagers[pageName] = eventManager;
        }
        return eventManager;
    };
    LCXLEncoderAbstract.prototype.registerEventDisplayValueChange = function (pageName, functor) {
        // LOG("registerEventDisplayValueChange: " + this.cc + " for page: " + pageName);
        var eventManager = this._makeEventManagerIfNeeded(pageName);
        eventManager.functorEventDisplayValueChange = functor;
        if (this.eventDisplayValueChangeRegistered == false) {
            this.eventDisplayValueChangeRegistered = true;
            this.element.mSurfaceValue.mOnDisplayValueChange =
                function (activeDevice, valueString) {
                    this._handleDisplayValueChanged(activeDevice, valueString);
                }.bind(this);
        }
    };
    LCXLEncoderAbstract.prototype.registerEventHostTitle = function (pageName, functor) {
        // LOG("registerEventHostTitle: " + this.cc + " for page: " + pageName);
        var eventManager = this._makeEventManagerIfNeeded(pageName);
        eventManager.functorHostTitle = functor;
        if (this.eventHostTitleRegistered == false) {
            this.eventHostTitleRegistered = true;
            this.element.mSurfaceValue.mOnTitleChange =
                function (activeDevice, value, units) {
                    this._handleTitleChange(activeDevice, value, units);
                }.bind(this);
        }
    };
    LCXLEncoderAbstract.prototype.registerEventProcessValueChange = function (pageName, functor) {
        // LOG("registerEventProcessValueChange: " + this.cc + " for page: " + pageName)
        var eventManager = this._makeEventManagerIfNeeded(pageName);
        eventManager.functorProcessValueChange = functor;
        if (this.eventProcessValueChangeRegistered == false) {
            this.eventProcessValueChangeRegistered = true;
            this.element.mSurfaceValue.mOnProcessValueChange =
                function (activeDevice, value) {
                    this._handleProcessValueChanged(activeDevice, value);
                }.bind(this);
        }
    };
    LCXLEncoderAbstract.prototype._handleTitleChange = function (activeDevice, value, units) {
        // LOG("_handleTitleChange: " + this.cc + " for page: " + this.currentpage);
        var eventManager = this._getEventManager(this.currentpage);
        if (null != eventManager) {
            // LOG("managerFound: " + this.cc + " for page: " + this.currentpage);
            if (null != eventManager.functorHostTitle) {
                //  LOG("functorFound: " + this.cc + " for page: " + this.currentpage);
                eventManager.functorHostTitle(activeDevice, value, units);
            }
        }
    };
    LCXLEncoderAbstract.prototype._handleDisplayValueChanged = function (activeDevice, valueString) {
        // LOG("_handleDisplayValueChanged: " + this.cc + " for page: " + this.currentpage);
        var eventManager = this._getEventManager(this.currentpage);
        if (null != eventManager) {
            // LOG("managerFound: " + this.cc + " for page: " + this.currentpage);
            if (null != eventManager.functorEventDisplayValueChange) {
                //  LOG("functorFound: " + this.cc + " for page: " + this.currentpage);
                eventManager.functorEventDisplayValueChange(activeDevice, valueString);
            }
        }
    };
    LCXLEncoderAbstract.prototype._handleProcessValueChanged = function (activeDevice, value) {
        // LOG("_handleProcessValueChanged: " + this.cc + " for page: " + this.currentpage);
        var eventManager = this._getEventManager(this.currentpage);
        if (null != eventManager) {
            //  LOG("managerFound: " + this.cc + " for page: " + this.currentpage);
            if (null != eventManager.functorProcessValueChange) {
                //   LOG("functorFound: " + this.cc + " for page: " + this.currentpage);
                eventManager.functorProcessValueChange(activeDevice, value);
            }
        }
    };
    return LCXLEncoderAbstract;
}());
var LCXLKnob = /** @class */ (function (_super) {
    __extends(LCXLKnob, _super);
    function LCXLKnob(device, address, cc, row, column) {
        return _super.call(this, device, address, cc, LCXLKnob.width, LCXLKnob.height, row, LCXLKnob.width * column) || this;
    }
    LCXLKnob.prototype.makeElement = function (surface, column, row) {
        return surface.makeKnob(column, row, this.width, this.height);
    };
    LCXLKnob.width = 2;
    LCXLKnob.height = 2;
    return LCXLKnob;
}(LCXLEncoderAbstract));
var LCXLFader = /** @class */ (function (_super) {
    __extends(LCXLFader, _super);
    function LCXLFader(device, address, cc, row, column) {
        return _super.call(this, device, address, cc, LCXLFader.width, LCXLFader.height, row, LCXLFader.width * column) || this;
    }
    LCXLFader.prototype.makeElement = function (surface, column, row) {
        return surface.makeFader(column, row, this.width, this.height);
    };
    LCXLFader.prototype.setColour = function (activeDevice, colour) {
        // This could be used to set the colour of the buttton bellow it
        // If this is removed and care is taken to not write the colour to the button.
        // But for now this is my own little Liskov, as this type shouldn't have to      
        // override it's parent.   
    };
    LCXLFader.prototype.turnOff = function (activeDevice) {
    };
    LCXLFader.width = 2;
    LCXLFader.height = 6;
    return LCXLFader;
}(LCXLEncoderAbstract));
var LCXLButton = /** @class */ (function (_super) {
    __extends(LCXLButton, _super);
    function LCXLButton(device, address, cc, row, column) {
        return _super.call(this, device, address, cc, LCXLButton.width, LCXLButton.height, row, LCXLButton.width * column) || this;
    }
    LCXLButton.prototype.makeElement = function (surface, column, row) {
        return surface.makeButton(column, row, this.width, this.height);
    };
    LCXLButton.width = 2;
    LCXLButton.height = 1;
    return LCXLButton;
}(LCXLEncoderAbstract));
var LCXLSideButton = /** @class */ (function (_super) {
    __extends(LCXLSideButton, _super);
    function LCXLSideButton(device, address, cc, row) {
        return _super.call(this, device, address, cc, LCXLSideButton.width, LCXLSideButton.height, LCXLKnob.height * 3 + row + 0.5 * row, LCXLButton.width * 8 + 0.75) || this;
    }
    LCXLSideButton.prototype.makeElement = function (surface, column, row) {
        return surface.makeButton(column, row, this.width, this.height);
    };
    LCXLSideButton.width = 1;
    LCXLSideButton.height = 1;
    return LCXLSideButton;
}(LCXLEncoderAbstract));
var LCXLDirectionButton = /** @class */ (function (_super) {
    __extends(LCXLDirectionButton, _super);
    function LCXLDirectionButton(device, address, cc, row, column) {
        return _super.call(this, device, address, cc, LCXLDirectionButton.width, LCXLDirectionButton.height, LCXLKnob.height * row + 0.2, LCXLFader.width * 8 + 0.25 + LCXLDirectionButton.width * column) || this;
    }
    LCXLDirectionButton.prototype.makeElement = function (surface, column, row) {
        return surface.makeButton(column, row, this.width, this.height);
    };
    LCXLDirectionButton.width = 1;
    LCXLDirectionButton.height = 1;
    return LCXLDirectionButton;
}(LCXLEncoderAbstract));
var LCXLEncoders = /** @class */ (function () {
    function LCXLEncoders(launchControlXL, surface) {
        this.knobsTop = [];
        for (var i = 0; i < 8; ++i) {
            this.knobsTop.push(launchControlXL.makeKnob(LaunchControlXL.EncoderAddress.KnobsTop[i], LaunchControlXL.CC.KnobsTop[i], 0, i));
        }
        this.upButton = launchControlXL.makeDirectionButton(LaunchControlXL.EncoderAddress.ButtonUp, LaunchControlXL.CC.ButtonUp, 1, 0);
        this.downButton = launchControlXL.makeDirectionButton(LaunchControlXL.EncoderAddress.ButtonDown, LaunchControlXL.CC.ButtonDown, 1, 1);
        this.leftButton = launchControlXL.makeDirectionButton(LaunchControlXL.EncoderAddress.ButtonLeft, LaunchControlXL.CC.ButtonLeft, 2, 0);
        this.rightButton = launchControlXL.makeDirectionButton(LaunchControlXL.EncoderAddress.ButtonRight, LaunchControlXL.CC.ButtonRight, 2, 1);
        this.sideButtons = [];
        for (var i = 0; i < 4; ++i) {
            this.sideButtons.push(launchControlXL.makeSideButton(LaunchControlXL.EncoderAddress.ButtonsSide[i], LaunchControlXL.CC.ButtonsSide[i], i));
        }
        this.knobsMiddle = [];
        for (var i = 0; i < 8; ++i) {
            this.knobsMiddle.push(launchControlXL.makeKnob(LaunchControlXL.EncoderAddress.KnobsMiddle[i], LaunchControlXL.CC.KnobsMiddle[i], LCXLKnob.height, i));
        }
        this.knobsBottom = [];
        for (var i = 0; i < 8; ++i) {
            this.knobsBottom.push(launchControlXL.makeKnob(LaunchControlXL.EncoderAddress.KnobsBottom[i], LaunchControlXL.CC.KnobsBottom[i], LCXLKnob.height * 2, i));
        }
        this.faders = [];
        for (var i = 0; i < 8; ++i) {
            this.faders.push(launchControlXL.makeFader(LaunchControlXL.EncoderAddress.Fader[i], LaunchControlXL.CC.Fader[i], LCXLKnob.height * 3, i));
        }
        this.buttonsTop = [];
        for (var i = 0; i < 8; ++i) {
            this.buttonsTop.push(launchControlXL.makeButton(LaunchControlXL.EncoderAddress.ButtonsTop[i], LaunchControlXL.CC.ButtonsTop[i], LCXLKnob.height * 3 + LCXLFader.height, i));
        }
        this.buttonsBottom = [];
        for (var i = 0; i < 8; ++i) {
            this.buttonsBottom.push(launchControlXL.makeButton(LaunchControlXL.EncoderAddress.ButtonsBottom[i], LaunchControlXL.CC.ButtonsBottom[i], LCXLKnob.height * 3 + LCXLFader.height + LCXLButton.height, i));
        }
        this.initSurface(surface);
    }
    LCXLEncoders.prototype.initSurface = function (surface) {
        var init = function (encoder) { encoder.initSurface(surface); }.bind(this);
        this.knobsTop.forEach(init);
        this.knobsMiddle.forEach(init);
        this.knobsBottom.forEach(init);
        this.buttonsTop.forEach(init);
        this.buttonsBottom.forEach(init);
        this.faders.forEach(init);
        this.sideButtons.forEach(init);
        this.upButton.initSurface(surface);
        this.downButton.initSurface(surface);
        this.leftButton.initSurface(surface);
        this.rightButton.initSurface(surface);
    };
    return LCXLEncoders;
}());
//-----------------------------------------------------------------------------
// 3. Launch Control - Controller
//-----------------------------------------------------------------------------
// First pass at event based model. Needs refactoring to "move up" an event based cleass
var LCXLController = /** @class */ (function () {
    function LCXLController(colour, mode) {
        if (mode === void 0) { mode = null; }
        this.colour = colour;
        this.isActive = true;
        this.bindingType = "none";
        this.registerEventHostTitle = false;
        this.registerEventDisplayValueChange = false;
        this.registerEventProcessValueChange = false;
        this.toggle = false;
        this.invert = false;
        this.bindingObject = null;
        this.mode = mode;
        // encoder is set by LCXLPage see next comment.
    }
    // Since variables are only available when in an object we have
    // to pass the name of the current page down to the encoder.
    // Unfortunate.
    LCXLController.prototype.resetEncoder = function (name) {
        this.encoder.resetPage(name);
    };
    LCXLController.prototype.reset = function (activeDevice) {
        // LOG(" ---- Reseting Controller:" + this.encoder.cc + " isActive: " + this.isActive)
        if (this.isActive == true) {
            this.encoder.setColour(activeDevice, this.colour.low);
        }
        else {
            this.encoder.setColour(activeDevice, this.colour.off);
        }
    };
    LCXLController.prototype.deactivate = function (activeDevice) {
        this.isActive = false;
        this.reset(activeDevice);
    };
    LCXLController.prototype.activate = function (activeDevice) {
        this.isActive = true;
        this.reset(activeDevice);
    };
    // Do to the Liskov issue and that we have to get the setting FROM THE PAGE
    // we have to duplicate the Cubase pattern. We can't just pass what to do to
    // the constructor.
    LCXLController.prototype.action = function (binding) {
        // LOG("action: " + typeof binding)
        this.bindingObject = binding;
        this.bindingType = "action";
        return this;
    };
    LCXLController.prototype.value = function (binding) {
        // LOG("value: " + typeof binding)
        this.bindingObject = binding;
        this.bindingType = "value";
        return this;
    };
    LCXLController.prototype.command = function (commandCategory, commandName) {
        this.bindingObject = [commandCategory, commandName];
        this.bindingType = "command";
        return this;
    };
    // late initialization of encoder so it doesn't have to be passed to the LCXLPage.
    // though additional encoders may be needed in extended constructors. This one
    // is always the focus that supplies the bindable.
    LCXLController.prototype.bindEncoder = function (pageName, page, encoder) {
        this.encoder = encoder;
        var bindable = encoder.element.mSurfaceValue;
        var binding = null;
        if (this.bindingType == 'value') {
            binding = this._value(page, this.bindingObject, bindable);
        }
        else if (this.bindingType == 'action') {
            binding = this._action(page, this.bindingObject, bindable);
        }
        else if (this.bindingType == 'command') {
            binding = this._command(page, this.bindingObject, bindable);
        }
        if (binding != null && this.invert == true) {
            binding.mapToValueRange(1, 0);
        }
        this._registerEventDisplayValueChange(pageName);
        this._registerEventHostTitle(pageName);
        this._registerEventProcessValueChange(pageName);
        // TODO: One would not thing that holding on to the binding 
        // should cuase any problems, but it's been learn as you go, and there
        // were performance issues early on, and this seemed to fix them.
        // Taking it out again is something to test.
        this.bindingObject = null;
    };
    // Do to the Liskov issue and that we have to get the setting FROM THE PAGE
    // we have to duplicate the Cubase pattern. 
    LCXLController.prototype._action = function (page, binding, bindable) {
        return page.makeActionBinding(bindable, binding);
    };
    LCXLController.prototype._command = function (page, binding, bindable) {
        return page.makeCommandBinding(bindable, binding[0], binding[1]);
    };
    LCXLController.prototype._value = function (page, binding, bindable) {
        var valueBinding = page.makeValueBinding(bindable, binding);
        if (null != this.mode) {
            if (this.mode == "pickup") {
                valueBinding.setValueTakeOverModePickup();
            }
            else if (this.mode == "scaled") {
                valueBinding.setValueTakeOverModeScaled();
            }
            else if (this.mode == "jump") {
                valueBinding.setValueTakeOverModeJump();
            }
        }
        if (this.toggle == true) {
            valueBinding.setTypeToggle();
        }
        return valueBinding;
    };
    LCXLController.prototype._registerEventDisplayValueChange = function (pageName) {
        if (this.registerEventDisplayValueChange) {
            this.encoder.registerEventDisplayValueChange(pageName, function (activeDevice, valueString) {
                this.handleDisplayValueChanged(activeDevice, valueString);
            }.bind(this));
        }
    };
    LCXLController.prototype._registerEventHostTitle = function (pageName) {
        if (this.registerEventHostTitle) {
            this.encoder.registerEventHostTitle(pageName, function (activeDevice, value, units) {
                this.handleTitleChange(activeDevice, value, units);
            }.bind(this));
        }
    };
    LCXLController.prototype._registerEventProcessValueChange = function (pageName) {
        if (this.registerEventProcessValueChange) {
            this.encoder.registerEventProcessValueChange(pageName, function (activeDevice, value) {
                this.handleProcessValueChanged(activeDevice, value);
            }.bind(this));
        }
    };
    LCXLController.prototype.handleTitleChange = function (activeDevice, value, units) { };
    LCXLController.prototype.handleDisplayValueChanged = function (activeDevice, valueString) { };
    LCXLController.prototype.handleProcessValueChanged = function (activeDevice, value) { };
    return LCXLController;
}());
//-----------------------------------------------------------------------------
// 4. Controller Library
//-----------------------------------------------------------------------------
// Controls a variable in any mode. Dims the LED when not captured
// Defaults tp pickup mode.
var Variable = /** @class */ (function (_super) {
    __extends(Variable, _super);
    function Variable(colour, mode) {
        if (mode === void 0) { mode = "pickup"; }
        var _this = _super.call(this, colour, mode) || this;
        _this.registerEventHostTitle = true;
        _this.registerEventDisplayValueChange = true;
        _this.registerEventProcessValueChange = true;
        _this.registerEventsEncoder = false;
        _this.encoderPosition = 0;
        _this.displayValue = "";
        _this.hostChangedWhenEncoderDidnt = 1;
        _this.encoderSensitivity = .005; // .5
        return _this;
    }
    Variable.prototype.evalEncoderSensitivity = function (encoderChange) {
        if (this.encoderSensitivity == 0) {
            return true;
        }
        return encoderChange < (0 - this.encoderSensitivity) || encoderChange > this.encoderSensitivity;
    };
    Variable.prototype.handleTitleChange = function (activeDevice, value, units) {
        // if(this.encoder.cc == 17) {
        // LOG("TTTTTTTTTTT handleTitleChange value: " + value + " units: " + units)
        // LOG("TTTTTTTTTTT cc: " + this.encoder.cc + " hostChange: " + this.hostChangedWhenEncoderDidnt);}
        this.hostChangedWhenEncoderDidnt = 2;
        this.eventHostDifferent(activeDevice, value);
    };
    Variable.prototype.handleDisplayValueChanged = function (activeDevice, valueString) {
        // var oldDisplayValue = this.displayValue;
        // if(this.encoder.cc == 17) {
        // LOG("DDDDDDDDDDD handleDisplayValueChanged value: " + valueString + " oldDisplayValue: " + oldDisplayValue);
        // LOG("DDDDDDDDDDD cc: " + this.encoder.cc + " hostChange: " + this.hostChangedWhenEncoderDidnt);}
        this.displayValue = valueString;
        if (this.hostChangedWhenEncoderDidnt == 0) {
            this.eventHostLikelySame(activeDevice, valueString, this.encoderPosition);
        }
    };
    Variable.prototype.handleProcessValueChanged = function (activeDevice, value) {
        var oldValue = this.encoderPosition;
        // if(this.encoder.cc == 17) {
        // LOG("PPPPPPPPPPP handleProcessValueChanged value: " + value + " oldValue: " + oldValue);
        // LOG("PPPPPPPPPPP cc: " + this.encoder.cc + " hostChange: " + this.hostChangedWhenEncoderDidnt);}
        this.encoderPosition = value;
        if (oldValue == value) {
            if (this.hostChangedWhenEncoderDidnt > 2) {
                this.eventHostDifferent(activeDevice, value);
            }
            this.hostChangedWhenEncoderDidnt++;
        }
        else
            this.hostChangedWhenEncoderDidnt = 0;
        if (this.registerEventsEncoder) {
            var encoderChange = value - oldValue;
            if (this.evalEncoderSensitivity(encoderChange)) {
                this.eventEncoderChanged(activeDevice, value, encoderChange);
            }
        }
    };
    Variable.prototype.eventHostLikelySame = function (activeDevice, valueString, value) {
        // LOG("---------- eventHostLikelySame valueString: " + valueString );
        this.encoder.setColour(activeDevice, this.colour.high);
    };
    Variable.prototype.eventHostDifferent = function (activeDevice, value) {
        // LOG("---------- eventHostDifferent value " + value);
        this.encoder.setColour(activeDevice, this.colour.low);
    };
    Variable.prototype.eventEncoderChanged = function (activeDevice, value, encoderChange) { };
    return Variable;
}(LCXLController));
//Convenience to not have to use a string to have a jump mode variable.
var VariableJump = /** @class */ (function (_super) {
    __extends(VariableJump, _super);
    function VariableJump(colour) {
        return _super.call(this, colour, "Jump") || this;
    }
    return VariableJump;
}(Variable));
//Convenience to not have to use a string to have a scaled mode variable.
var VariableScaled = /** @class */ (function (_super) {
    __extends(VariableScaled, _super);
    function VariableScaled(colour) {
        return _super.call(this, colour, "scaled") || this;
    }
    return VariableScaled;
}(Variable));
// There are NO events to tell us when the host changed
// so if one of the functions in this commander changes state
// there is no way to know, and any encoder dependent on it will
// be in an incorrect state until it cycles through the difference.
// The use case is for example the preFilter which turns on and off
// as a VariableSwitch. But once on, if you turn it off in the host
// the light can not reflect this.
// Will however, trigger all of the actions commands or boolean values
// that are added wiht triggerAll, or one at a time with trigger(i)
var Commander = /** @class */ (function () {
    function Commander(name) {
        this.name = name;
        this.elements = [];
    }
    Commander.prototype.length = function () {
        return this.elements.length;
    };
    Commander.prototype.addTriggerValue = function (surface, page, binding) {
        var element = surface.makeCustomValueVariable(this.name + this.elements.length);
        // LOG("value- " + JSON.stringify(element))
        page.makeValueBinding(element, binding).setTypeToggle();
        this.elements.push(element);
        return this;
    };
    Commander.prototype.addTriggerCommand = function (surface, page, commandCategory, commandName) {
        var element = surface.makeCustomValueVariable(this.name + this.elements.length);
        // LOG("command- " + JSON.stringify(element))
        page.makeCommandBinding(element, commandCategory, commandName);
        this.elements.push(element);
        return this;
    };
    Commander.prototype.addTriggerAction = function (surface, page, binding) {
        var element = surface.makeCustomValueVariable(this.name + this.elements.length);
        // LOG("action- " + JSON.stringify(element))
        page.makeActionBinding(element, binding);
        this.elements.push(element);
        return this;
    };
    Commander.prototype.triggerOff = function (activeDevice) {
        this.triggerAll(activeDevice, 0);
    };
    Commander.prototype.trigger = function (activeDevice, index, value) {
        if (index === void 0) { index = 0; }
        if (value === void 0) { value = 1; }
        var element = this.elements[index];
        // LOG("triggering: " + element + " " + i + " value: " + value)
        this.elements[index].setProcessValue(activeDevice, value);
    };
    Commander.prototype.triggerAll = function (activeDevice, value) {
        if (value === void 0) { value = 1; }
        // LOG("trigger: " + this.elements.length )
        for (var i = 0; i < this.elements.length; i++) {
            this.trigger(activeDevice, i, value);
        }
    };
    return Commander;
}());
// switch it on, and then it is a variable.
var VariableSwitch = /** @class */ (function (_super) {
    __extends(VariableSwitch, _super);
    function VariableSwitch(colour, commander, triggerWhen, mode) {
        if (triggerWhen === void 0) { triggerWhen = null; }
        if (mode === void 0) { mode = "scaled"; }
        var _this = _super.call(this, colour, mode) || this;
        _this.triggerWhen = triggerWhen;
        _this.commander = commander;
        _this.isOn = false;
        return _this;
    }
    VariableSwitch.prototype.eventHostLikelySame = function (activeDevice, valueString, value) {
        // LOG("---------- VariableSwitch eventHostLikelySame valueString: " + valueString + " value: " + value);
        if (valueString != this.triggerWhen) {
            // LOG("trigger on: " + this.isOn)
            if (!this.isOn) {
                this.isOn = true;
                this.commander.triggerAll(activeDevice);
            }
            this.encoder.setColour(activeDevice, this.colour.high);
        }
        else if (valueString == this.triggerWhen && this.isOn) {
            // LOG("trigger off " + this.isOn)
            this.isOn = false;
            this.commander.triggerOff(activeDevice);
            this.encoder.setColour(activeDevice, this.colour.off);
        }
    };
    VariableSwitch.prototype.eventHostDifferent = function (activeDevice, value) {
        // LOG("----------  VariableSwitcheventHostDifferent value " + value);
        this.encoder.setColour(activeDevice, this.colour.low);
    };
    return VariableSwitch;
}(Variable));
// controls a knob or slider used to slect multiple options.
var Options = /** @class */ (function (_super) {
    __extends(Options, _super);
    function Options(defaultColour, colours) {
        var _this = _super.call(this, Inactive, "jump") || this;
        _this.count = colours.length;
        _this.colours = colours;
        _this.defaultColour = defaultColour;
        _this.slices = [];
        _this.registerEventProcessValueChange = true;
        _this.lastSlice = -1;
        var size = 1 / _this.count;
        for (var i = 0; i < _this.count; i++) {
            _this.slices.push((i + 1) * size);
        }
        return _this;
    }
    Options.prototype.reseet = function (activeDevice) {
        if (this.isActive == true) {
            this.encoder.setColour(activeDevice, this.defaultColour);
        }
        else {
            this.encoder.setOff(activeDevice);
        }
    };
    Options.prototype.eventIndexSelected = function (activeDevice, i) {
        this.encoder.setColour(activeDevice, this.colours[i]);
    };
    Options.prototype.handleProcessValueChanged = function (activeDevice, value) {
        //LOG("---------- Options handleProcessValueChanged value: " + value);
        for (var i = 0; i < this.count; i++) {
            if (value <= this.slices[i] || i == this.count - 1) {
                this.lastSlice = i;
                this.eventIndexSelected(activeDevice, i);
                break;
            }
        }
    };
    return Options;
}(LCXLController));
// Like Options, but manipulates another encoder's colour used to change the colour of
// an LED based on a Glide (fader) which doesn't have it's own LED.
var OptionsManipulator = /** @class */ (function (_super) {
    __extends(OptionsManipulator, _super);
    function OptionsManipulator(defaultColour, colours, displayValues, manipulatedController, mode) {
        if (mode === void 0) { mode = "scaled"; }
        var _this = _super.call(this, Inactive, mode) || this;
        _this.count = colours.length;
        _this.colours = colours;
        _this.defaultColour = defaultColour;
        _this.displayValues = displayValues;
        _this.registerEventDisplayValueChange = true;
        _this.manipulatedController = manipulatedController;
        _this.manipulatedController.colour = _this.defaultColour;
        return _this;
    }
    OptionsManipulator.prototype.reset = function (activeDevice) {
        _super.prototype.reset.call(this, activeDevice);
        this.manipulateColour(activeDevice, this.defaultColour);
    };
    OptionsManipulator.prototype.manipulateColour = function (activeDevice, colour) {
        this.manipulatedController.colour = colour;
        this.manipulatedController.reset(activeDevice);
    };
    OptionsManipulator.prototype.handleDisplayValueChanged = function (activeDevice, valueString) {
        // LOG("OptionsManipulator handleDisplayValueChanged - valueString: " + valueString)
        for (var i = 0; i < this.count; i++) {
            if (valueString == this.displayValues[i]) {
                this.manipulateColour(activeDevice, this.colours[i]);
                break;
            }
        }
    };
    return OptionsManipulator;
}(LCXLController));
// Controls a knob or slider used as a switch. Always in jump mode.
var Switch = /** @class */ (function (_super) {
    __extends(Switch, _super);
    function Switch(onColour, offColour, onTrigger) {
        if (onTrigger === void 0) { onTrigger = "On"; }
        var _this = _super.call(this, Inactive, "jump") || this;
        _this.isOn = false;
        _this.onColour = onColour;
        _this.offColour = offColour;
        _this.onTrigger = onTrigger;
        _this.registerEventDisplayValueChange = true;
        return _this;
    }
    Switch.prototype.reset = function (activeDevice) {
        if (this.isActive == true) {
            if (this.isOn == true) {
                this.encoder.setColour(activeDevice, this.onColour);
            }
            else {
                this.encoder.setColour(activeDevice, this.offColour);
            }
        }
        else {
            this.encoder.setColour(activeDevice, this.colour.off);
        }
    };
    Switch.prototype.handleDisplayValueChanged = function (activeDevice, valueString) {
        // LOG("---------- SWITCH handleDisplayValueChanged value: " + valueString );
        this.isOn = (valueString == this.onTrigger);
        this.reset(activeDevice);
    };
    return Switch;
}(LCXLController));
// controls a knob or fader defaults to scaled mode.
// Likely used for a fader as there is no feedback, and 
// LCXL has no LED feedback on faders. Scalled works better for 
// faders.
var Glide = /** @class */ (function (_super) {
    __extends(Glide, _super);
    function Glide(colour, mode) {
        if (colour === void 0) { colour = Inactive; }
        if (mode === void 0) { mode = "scaled"; }
        return _super.call(this, colour, mode) || this;
    }
    return Glide;
}(LCXLController));
// Intended to control a button that toggles between two states.
// always in jump mode for this to function properly
// TODO: Fix defect where LCXL always shows bright yellow
// when toggle is ON. Tried LCXL buffering and fliping
// On is allways yellow.
var Toggle = /** @class */ (function (_super) {
    __extends(Toggle, _super);
    function Toggle(colour) {
        var _this = _super.call(this, colour, "jump") || this;
        _this.registerEventProcessValueChange = true;
        _this.toggle = true;
        return _this;
    }
    Toggle.prototype.handleProcessValueChanged = function (activeDevice, value) {
        // LOG("---------- Toggle handleProcessValueChanged value: " + value);
        if (value == "1") { // On
            // LOG("HIGH")
            this.encoder.setColour(activeDevice, this.colour.low);
        }
        else {
            // LOG("LOW") // Off
            this.encoder.setColour(activeDevice, this.colour.high);
        }
    };
    return Toggle;
}(LCXLController));
var InvertedToggle = /** @class */ (function (_super) {
    __extends(InvertedToggle, _super);
    function InvertedToggle(colour) {
        var _this = _super.call(this, colour) || this;
        _this.invert = true;
        return _this;
    }
    return InvertedToggle;
}(Toggle));
// Toggle that also can deactivate another controller's LEDs (turn them off)
var ToggleActivator = /** @class */ (function (_super) {
    __extends(ToggleActivator, _super);
    function ToggleActivator(colour, targetController) {
        var _this = _super.call(this, colour) || this;
        _this.targetController = targetController;
        return _this;
    }
    ToggleActivator.prototype.handleProcessValueChanged = function (activeDevice, value) {
        _super.prototype.handleProcessValueChanged.call(this, activeDevice, value);
        if (value != "1") { // off
            this.targetController.deactivate(activeDevice);
        }
        else {
            this.targetController.activate(activeDevice);
        }
    };
    return ToggleActivator;
}(Toggle));
// Intended to be used with a button.
// A one time trigger typically used for actions and commands.
var Trigger = /** @class */ (function (_super) {
    __extends(Trigger, _super);
    function Trigger(colour) {
        var _this = _super.call(this, colour, "jump") || this;
        _this.toggle = false;
        _this.registerEventProcessValueChange = true;
        return _this;
    }
    Trigger.prototype.handleProcessValueChanged = function (activeDevice, value) {
        //LOG("---------- Press handleProcessValueChanged value: " + value );
        if (value == 1) {
            this.encoder.setColour(activeDevice, this.colour.high);
        }
        else {
            this.encoder.setColour(activeDevice, this.colour.low);
        }
    };
    return Trigger;
}(LCXLController));
//-----------------------------------------------------------------------------
// 5. Launch Control - Page
//-----------------------------------------------------------------------------
var LCXLPage = /** @class */ (function () {
    function LCXLPage(name, deviceDriver, encoders) {
        this.name = name;
        this._knobsTop = [];
        this._sideButtons = [];
        this._knobsMiddle = [];
        this._knobsBottom = [];
        this._faders = [];
        this._buttonsTop = [];
        this._buttonsBottom = [];
        this.page = deviceDriver.mMapping.makePage(this.name);
        this.encoders = encoders;
        // Always map the up and down button to changing the page.
        // the left and right buttons match the Cubase display, but these are more
        // convenient erganomicaly. Can be easily switched.
        this.leftButton(new LCXLController(Red).action(deviceDriver.mAction.mPrevPage));
        this.rightButton(new LCXLController(Red).action(deviceDriver.mAction.mNextPage));
        this.page.mOnActivate = function (activeDevice) {
            // Setting the Global so that events can be per page, per encoder, per Event.
            // LOG("Reseting: " + this.name);
            this.reset(activeDevice);
        }.bind(this);
        // this.page.mOnDeactivate = function (activeDevice) {
        //     // LOG('Page off: ');
        // }.bind(this);
    }
    LCXLPage.prototype.upButton = function (controller) {
        this._upButton = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.upButton);
    };
    LCXLPage.prototype.downButton = function (controller) {
        this._downButton = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.downButton);
    };
    LCXLPage.prototype.leftButton = function (controller) {
        this._leftButton = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.leftButton);
    };
    LCXLPage.prototype.rightButton = function (controller) {
        this._rightButton = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.rightButton);
    };
    // Sets the first n rows to the array provided.
    LCXLPage.prototype.topKnobRow = function (controllers) {
        var f = function (c, i) { this.setKnobTop(c, i); }.bind(this);
        controllers.forEach(f);
    };
    // sets the i'th controller for the top row knob.
    LCXLPage.prototype.setKnobTop = function (controller, i) {
        // LOG("setKnobTop: " + i + " controler: " + controller)
        this._knobsTop[i] = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.knobsTop[i]);
    };
    LCXLPage.prototype.middleKnobRow = function (controllers) {
        var f = function (c, i) { this.setKnobMiddle(c, i); }.bind(this);
        controllers.forEach(f);
    };
    LCXLPage.prototype.setKnobMiddle = function (controller, i) {
        // LOG("setKnobMiddle: " + i + " controler: " + controller)
        this._knobsMiddle[i] = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.knobsMiddle[i]);
    };
    // Sets the top left 8 knobs (top 0-3 and middle 0-3)
    LCXLPage.prototype.topLeftKnobBank = function (controllers) {
        var f = function (c, i) {
            if (i < 4) {
                this.setKnobTop(c, i);
            }
            else {
                this.setKnobMiddle(c, i - 4);
            }
        }.bind(this);
        controllers.forEach(f);
    };
    // Sets the top right 8 knobs (top 4-7 and middle 4-7)
    LCXLPage.prototype.topRightKnobBank = function (controllers) {
        // LOG("topRightKnobBank count=" + controllers.length)
        var f = function (c, i) {
            if (i < 4) {
                // LOG("topRightKnobBank-A " + (i+4))
                this.setKnobTop(c, i + 4);
            }
            else {
                // LOG("topRightKnobBank-B " + i)
                this.setKnobMiddle(c, i);
            }
        }.bind(this);
        controllers.forEach(f);
    };
    LCXLPage.prototype.lowerKnobRow = function (controllers) {
        var f = function (c, i) { this.setKnobBottom(c, i); }.bind(this);
        controllers.forEach(f);
    };
    // The right 4 bottom row knobs (to set the left ones, just use lowerKnobRow with only 4 controllers)
    LCXLPage.prototype.lowerRightKnobs = function (controllers) {
        var f = function (c, i) { this.setKnobBottom(c, i + 4); }.bind(this);
        controllers.forEach(f);
    };
    LCXLPage.prototype.setKnobBottom = function (controller, i) {
        // LOG("setKnobBottom: " + i + " controler: " + controller)
        this._knobsBottom[i] = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.knobsBottom[i]);
    };
    LCXLPage.prototype.faders = function (controllers) {
        var f = function (c, i) { this.setFader(c, i); }.bind(this);
        controllers.forEach(f);
    };
    LCXLPage.prototype.setFader = function (controller, i) {
        this._faders[i] = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.faders[i]);
    };
    LCXLPage.prototype.topButtonRow = function (controllers) {
        var f = function (c, i) { this.setButtonTop(c, i); }.bind(this);
        controllers.forEach(f);
    };
    LCXLPage.prototype.setButtonTop = function (controller, i) {
        this._buttonsTop[i] = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.buttonsTop[i]);
    };
    LCXLPage.prototype.lowerButtonRow = function (controllers) {
        var f = function (c, i) { this.setButtonBottom(c, i); }.bind(this);
        controllers.forEach(f);
    };
    LCXLPage.prototype.setButtonBottom = function (controller, i) {
        this._buttonsBottom[i] = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.buttonsBottom[i]);
    };
    LCXLPage.prototype.sideButtons = function (controllers) {
        var f = function (c, i) { this.setSideButton(c, i); }.bind(this);
        controllers.forEach(f);
    };
    LCXLPage.prototype.setSideButton = function (controller, i) {
        this._sideButtons[i] = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.sideButtons[i]);
    };
    // a whole collumn, 3 knobs, fader and 2 buttons
    LCXLPage.prototype.columnFull = function (controllers, i) {
        this.columnAboveButtomBotton(controllers, i);
        this.setButtonBottom(controllers[5], i);
    };
    // the whole column without the last button
    LCXLPage.prototype.columnAboveButtomBotton = function (controllers, i) {
        this.setKnobTop(controllers[0], i);
        this.setKnobMiddle(controllers[1], i);
        this.setKnobBottom(controllers[2], i);
        this.setFader(controllers[3], i);
        this.setButtonTop(controllers[4], i);
    };
    // the column including the bottom knob, the fader and the two buttons
    LCXLPage.prototype.columnBelowBankOneButton = function (controllers, i) {
        this.setKnobBottom(controllers[0], i);
        this.setFader(controllers[1], i);
        this.setButtonTop(controllers[2], i);
    };
    // a column with just the fader and two buttons.
    LCXLPage.prototype.columnBelowKnobs = function (controllers, i) {
        this.setFader(controllers[1], i);
        this.setButtonTop(controllers[2], i);
        this.setButtonBottom(controllers[3], i);
    };
    LCXLPage.prototype.reset = function (activeDevice) {
        var init = function (controller) {
            controller.resetEncoder(this.name);
            controller.reset(activeDevice);
        }.bind(this);
        // LOG("Reseting _knobsTop")
        this._knobsTop.forEach(init);
        // LOG("Reseting _knobsMiddle")
        this._knobsMiddle.forEach(init);
        // LOG("Reseting _knobsBottom")
        this._knobsBottom.forEach(init);
        // LOG("Reseting _buttonsTop")
        this._buttonsTop.forEach(init);
        // LOG("Reseting _buttonsBottom")
        this._buttonsBottom.forEach(init);
        // LOG("Reseting _faders")
        this._faders.forEach(init);
        // LOG("Reseting _sideButtons")
        this._sideButtons.forEach(init);
        if (null != this._upButton) {
            // LOG("Reseting _upButton")
            this._upButton.reset(activeDevice);
        }
        if (null != this._downButton) {
            // LOG("Reseting _downButton")
            this._downButton.reset(activeDevice);
        }
        if (null != this._leftButton) {
            // LOG("Reseting _leftButton")
            this._leftButton.reset(activeDevice);
        }
        if (null != this._rightButton) {
            // LOG("Reseting _rightButton")
            this._rightButton.reset(activeDevice);
        }
    };
    return LCXLPage;
}());
// Sets the up down buttons to track next prev.
var LCXLPageTrack = /** @class */ (function (_super) {
    __extends(LCXLPageTrack, _super);
    function LCXLPageTrack(name, deviceDriver, encoders) {
        var _this = _super.call(this, name, deviceDriver, encoders) || this;
        _this.upButton(new LCXLController(Red).action(_this.page.mHostAccess.mTrackSelection.mAction.mPrevTrack));
        _this.downButton(new LCXLController(Red).action(_this.page.mHostAccess.mTrackSelection.mAction.mNextTrack));
        return _this;
    }
    return LCXLPageTrack;
}(LCXLPage));
//-----------------------------------------------------------------------------
// 6. Convenience functions
//-----------------------------------------------------------------------------
var trackQuickControls = function (colour, page) {
    var quickControls = [];
    for (var i = 0; i < 8; i++) {
        quickControls.push(new Variable(colour).value(page.mHostAccess.mTrackSelection.mMixerChannel.mQuickControls.getByIndex(i)));
    }
    return quickControls;
};
var trackQuickControlsGlide = function (page) {
    var quickControls = [];
    for (var i = 0; i < 8; i++) {
        quickControls.push(new Glide().value(page.mHostAccess.mTrackSelection.mMixerChannel.mQuickControls.getByIndex(i)));
    }
    return quickControls;
};
var focusedQuickControls = function (colour, page) {
    var quickControls = [];
    for (var i = 0; i < 8; i++) {
        quickControls.push(new Variable(colour).value(page.mHostAccess.mFocusedQuickControls.getByIndex(i)));
    }
    return quickControls;
};
// para 1, low shel 1, high pass 1, high pass 2, para 2, low shelf 2, 3, 4
var eqColunns1 = function (page) {
    return [new Options(Red.low, [Yellow.low, Orange.high, Green.low, Green.med, Yellow.high, Red.low, Red.med, Red.high])
            .value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand1.mFilterType),
        new VariableScaled(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand1.mQ),
        new Variable(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand1.mFreq),
        new Glide().value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand1.mGain),
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand1.mOn)
    ];
};
// para 1, para 2
var eqColunns2 = function (page) {
    return [new Options(Yellow.high, [Yellow.low, Yellow.high]).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand2.mFilterType),
        new VariableScaled(Orange).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand2.mQ),
        new Variable(Orange).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand2.mFreq),
        new Glide().value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand2.mGain),
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand2.mOn)
    ];
};
// para 1, para 2
var eqColunns3 = function (page) {
    return [new Options(Yellow.high, [Yellow.low, Yellow.high]).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand3.mFilterType),
        new VariableScaled(Amber).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand3.mQ),
        new Variable(Amber).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand3.mFreq),
        new Glide().value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand3.mGain),
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand3.mOn)
    ];
};
// para 1, high shel 1, low pass 1, low pass 2, para 2, high shelf 2, 3, 4
var eqColunns4 = function (page) {
    return [new Options(Green.low, [Yellow.low, Lime.low, Red.low, Red.med, Yellow.high, Green.low, Green.med, Green.high])
            .value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand4.mFilterType),
        new VariableScaled(Green).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand4.mQ),
        new Variable(Green).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand4.mFreq),
        new Glide().value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand4.mGain),
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand4.mOn)
    ];
};
var trackButtonValues = function (page) {
    // On these buttons if used on the side buttons red is off BC there is no
    // green LED on the side buttons.
    return [
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMonitorEnable),
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMute),
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mSolo),
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mRecordEnable)
    ];
};
// The regular value for selected track do not work on midi tracks
// But these command options do. However, there is no direct feedback, so the 
// LEDs will not change.
var trackButtonCommands = function (page) {
    return [
        new Toggle(Orange).command('Edit', 'Monitor'),
        new Toggle(Orange).command('Edit', 'Mute'),
        new Toggle(Orange).command('Edit', 'Solo'),
        new Toggle(Orange).command('Edit', 'Record Enable')
    ];
};
var sendsColumn = function (page, i) {
    var send = page.mHostAccess.mTrackSelection.mMixerChannel.mSends.getByIndex(i);
    var prepost = new Switch(Lime.high, Orange.high).value(send.mPrePost);
    var level = new Glide().value(send.mLevel);
    var on = new ToggleActivator(Orange, prepost).value(send.mOn);
    return [prepost, level, on];
};
var trackColumn = function (page) {
    return [
        new VariableScaled(Amber).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan),
        new Glide().value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume),
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mAutomationWrite),
        new Toggle(Lime).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen)
    ];
};
var preFilterHigh = function (colour, surface, page) {
    return new VariableSwitch(colour, new Commander("preFilterHigh")
        .addTriggerValue(surface, page, page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mHighCutOn), "20000Hz")
        .value(page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mHighCutFreq);
};
var preFilterLow = function (colour, surface, page) {
    return new VariableSwitch(colour, new Commander("preFilterLow")
        .addTriggerValue(surface, page, page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mLowCutOn), "20.0Hz")
        .value(page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mLowCutFreq);
};
var preFilterLowSlope = function (page, low) {
    return new OptionsManipulator(Amber, [Red, Orange, Amber, Yellow, Green], ["6 dB/Oct", "12 dB/Oct", "24 dB/Oct", "36 dB/Oct", "48 dB/Oct"], low)
        .value(page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mLowCutSlope);
};
var preFilterHighSlope = function (page, high) {
    return new OptionsManipulator(Amber, [Red, Orange, Amber, Yellow, Green], ["6 dB/Oct", "12 dB/Oct", "24 dB/Oct", "36 dB/Oct", "48 dB/Oct"], high)
        .value(page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mHighCutSlope);
};
var metronomeSwitch = function (colour, surface, page) {
    return new VariableSwitch(colour, new Commander("metronomeActive")
        .addTriggerValue(surface, page, page.mHostAccess.mTransport.mValue.mMetronomeActive), "0", "pickup")
        .value(page.mHostAccess.mTransport.mValue.mMetronomeClickLevel);
};
var transport = function (page) {
    return [
        new Trigger(Amber).command('Transport', 'To Left Locator'),
        new Trigger(Lime).command('Transport', 'To Right Locator'),
        new Trigger(Orange).value(page.mHostAccess.mTransport.mValue.mRewind),
        new Trigger(Lime).value(page.mHostAccess.mTransport.mValue.mForward),
        new Toggle(Orange).value(page.mHostAccess.mTransport.mValue.mCycleActive),
        new Toggle(Green).value(page.mHostAccess.mTransport.mValue.mStart),
        new Toggle(Red).value(page.mHostAccess.mTransport.mValue.mRecord)
    ];
};
var nudgeButtons = function () {
    return [
        new Trigger(Yellow).command('Nudge', 'Start Left'),
        new Trigger(Lime).command('Nudge', 'Start Right'),
        new Trigger(Amber).command('Nudge', 'Left'),
        new Trigger(Lime).command('Nudge', 'Right'),
        new Trigger(Orange).command('Nudge', 'End Left'),
        new Trigger(Lime).command('Nudge', 'End Right'),
        new Trigger(Orange).command('Nudge', 'Loop Range Left'),
        new Trigger(Green).command('Nudge', 'Loop Range Right'),
    ];
};
var setTransportEditTrackButtons = function (lcxlPage) {
    lcxlPage.lowerButtonRow(transport(lcxlPage.page));
    lcxlPage.setButtonBottom(new Toggle(Lime).value(lcxlPage.page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen), 7);
    lcxlPage.sideButtons(trackButtonValues(lcxlPage.page));
};
var setTransportEditTrackButtonsInstrument = function (lcxlPage) {
    lcxlPage.lowerButtonRow(transport(lcxlPage.page));
    lcxlPage.setButtonBottom(new Toggle(Lime).value(lcxlPage.page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mInstrumentOpen), 7);
    lcxlPage.sideButtons(trackButtonCommands(lcxlPage.page));
};
//-----------------------------------------------------------------------------
// 7. Launch Control Setup
//-----------------------------------------------------------------------------
var launchControlXL = new LaunchControlXL(deviceDriver, expectedName);
var lcxlEncoders = launchControlXL.makeEncoders(deviceDriver.mSurface);
//var lcxlEncoders2 = launchControlXL.makeEncoders(deviceDriver.mSurface);
// Iniitalize
//-----------------------------------------------------------------------------
deviceDriver.mOnActivate = function (activeDevice) {
    launchControlXL.initialize(activeDevice);
    LOG('Launch Control XL Initialized');
};
// deviceDriver.mOnDeactivate = function (activeDevice) {
//     //LOG('Launch Control XL Deinitialized');
// };
//-----------------------------------------------------------------------------
// 8. Launch Control Pages
//-----------------------------------------------------------------------------
// Mixer
// -----------------------------------------------------------------------------
var PageMixer = new LCXLPage("Mixer", deviceDriver, lcxlEncoders);
var mixerBankZone = PageMixer.page.mHostAccess.mMixConsole.makeMixerBankZone("Mixer");
PageMixer.upButton(new LCXLController(Red).action(mixerBankZone.mAction.mPrevBank));
PageMixer.downButton(new LCXLController(Red).action(mixerBankZone.mAction.mNextBank));
var mixerChannels = [];
for (var i = 0; i < 8; i++) {
    mixerChannels.push(mixerBankZone.makeMixerBankChannel());
}
var mixerSelected = [];
for (var i = 0; i < 8; i++) {
    mixerSelected.push(new Toggle(Inactive).value(mixerChannels[i].mValue.mSelected));
}
PageMixer.topButtonRow(mixerSelected);
var mixerVolume = [];
for (var i = 0; i < 8; i++) {
    mixerVolume.push(new Glide().value(mixerChannels[i].mValue.mVolume));
}
PageMixer.faders(mixerVolume);
var mixerPan = [];
for (var i = 0; i < 8; i++) {
    mixerPan.push(new Variable(Amber).value(mixerChannels[i].mValue.mPan));
}
PageMixer.lowerKnobRow(mixerPan);
var mixerFirstSend = [];
for (var i = 0; i < 8; i++) {
    mixerFirstSend.push(new Variable(Yellow).value(mixerChannels[i].mSends.getByIndex(0).mLevel));
}
PageMixer.middleKnobRow(mixerFirstSend);
var mixerCue = [];
for (var i = 0; i < 8; i++) {
    mixerCue.push(new Variable(Green).value(mixerChannels[i].mCueSends.getByIndex(0).mLevel));
}
PageMixer.topKnobRow(mixerCue);
PageMixer.sideButtons(trackButtonValues(PageMixer.page));
PageMixer.lowerButtonRow(transport(PageMixer.page));
PageMixer.setButtonBottom(new Toggle(Red).value(PageMixer.page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mAutomationWrite), 7);
// Track
//-----------------------------------------------------------------------------
var PageTrack = new LCXLPageTrack("Track", deviceDriver, lcxlEncoders);
//EQ
PageTrack.columnAboveButtomBotton(eqColunns1(PageTrack.page), 0);
PageTrack.columnAboveButtomBotton(eqColunns2(PageTrack.page), 1);
PageTrack.columnAboveButtomBotton(eqColunns3(PageTrack.page), 2);
PageTrack.columnAboveButtomBotton(eqColunns4(PageTrack.page), 3);
// Focus Controls
//audioPage.topRightKnobBank(trackQuickControls(Green, page));
PageTrack.topRightKnobBank(focusedQuickControls(Red, PageTrack.page));
// Pre
var pfl = preFilterLow(Amber, deviceDriver.mSurface, PageTrack.page);
var pfh = preFilterHigh(Amber, deviceDriver.mSurface, PageTrack.page);
PageTrack.lowerRightKnobs([
    pfl, pfh,
    new VariableScaled(Red).value(PageTrack.page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mGain)
]);
PageTrack.setFader(preFilterLowSlope(PageTrack.page, pfl), 4);
PageTrack.setFader(preFilterHighSlope(PageTrack.page, pfh), 5);
PageTrack.setButtonTop(new InvertedToggle(Orange).value(PageTrack.page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mBypass), 4);
PageTrack.setButtonTop(new Toggle(Orange).value(PageTrack.page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mPhaseSwitch), 5);
// metronome
PageTrack.setFader(metronomeSwitch(Lime, deviceDriver.mSurface, PageTrack.page), 6);
// instrument open
PageTrack.setButtonTop(new Toggle(Lime).value(PageTrack.page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mInstrumentOpen), 6);
// pan valume write channelStrip open
PageTrack.columnBelowBankOneButton(trackColumn(PageTrack.page), 7);
setTransportEditTrackButtons(PageTrack);
// Sends
// -----------------------------------------------------------------------------
var PageSends = new LCXLPageTrack("Sends", deviceDriver, lcxlEncoders);
// Track Controls
PageSends.topLeftKnobBank(trackQuickControls(Green, PageSends.page));
// Focus Controls
PageSends.topRightKnobBank(focusedQuickControls(Red, PageSends.page));
// Sends
for (var i = 0; i < 8; i++) {
    PageSends.columnBelowBankOneButton(sendsColumn(PageSends.page, i), i);
}
setTransportEditTrackButtons(PageSends);
// Instrument
// -----------------------------------------------------------------------------
var PageInstrument = new LCXLPageTrack("Instrument", deviceDriver, lcxlEncoders);
// Top two rows of knobs (except for the last two) are assignable in the GUI.
for (var i = 0; i < 7; i++) {
    PageInstrument.setKnobTop(new Variable(Orange), i);
    PageInstrument.setKnobMiddle(new Variable(Orange), i);
}
// smart control
PageInstrument.setKnobTop(new VariableScaled(Red).value(PageInstrument.page.mHostAccess.mMouseCursor.mValueUnderMouse), 7);
PageInstrument.setKnobMiddle(new Switch(Amber.low, Red.high).value(PageInstrument.page.mHostAccess.mMouseCursor.mValueLocked), 7);
// QCs
PageInstrument.lowerKnobRow(focusedQuickControls(Red, PageTrack.page));
PageInstrument.faders(trackQuickControlsGlide(PageInstrument.page));
// Nuge Nuttons
PageInstrument.topButtonRow(nudgeButtons());
// Transport with instrument instead of edit channel
setTransportEditTrackButtonsInstrument(PageInstrument);
// Cue For 4 piece recording
// -----------------------------------------------------------------------------
// WIP Should work, but I can't compleatly test this right now
// if 4 cue channels are set this controls the send for the selected track
// with talkback at the top, switch it on, then it's talkback volume.
var cueTrackColumn = function (surface, page, index) {
    var cueChannel = page.mHostAccess.mControlRoom.getCueChannelByIndex(index);
    var cueChannelTalkback = new VariableSwitch(Yellow, new Commander("cue" + index + "Talkback").addTriggerValue(surface, page, cueChannel.mTalkbackEnabledValue), "0", "pickup").value(cueChannel.mTalkbackLevelValue);
    var cueSend = page.mHostAccess.mTrackSelection.mMixerChannel.mCueSends.getByIndex(index);
    var cueTrackPrepost = new Switch(Lime.high, Orange.high).value(cueSend.mPrePost);
    var cueTrackPan = new Variable(Amber).value(cueSend.mPan);
    var cueTrackLevel = new Glide().value(cueSend.mLevel);
    var cueTrackOn = new Toggle(Lime).value(cueSend.mOn);
    return [cueChannelTalkback, cueTrackPrepost, cueTrackPan, cueTrackLevel, cueTrackOn];
};
// Control one of 4 cue channels.  
var cueChannelColumn = function (surface, page, index) {
    var cueChannel = page.mHostAccess.mControlRoom.getCueChannelByIndex(index);
    var cusChannelBypassInserts = new Switch(Lime.high, Orange.high).value(cueChannel.mBypassInserts);
    var cusChannelClickPan = new Variable(Amber).value(cueChannel.mMetronomeClickPanValue);
    var cusChanneClickSwitch = new VariableSwitch(Green, new Commander("cue" + index + "Metronome").addTriggerValue(surface, page, cueChannel.mMetronomeClickActiveValue), "0", "pickup").value(cueChannel.mMetronomeClickLevelValue);
    var cusChannelLevel = new Glide().value(cueChannel.mLevelValue);
    var cusChannelMute = new Toggle(Green).value(cueChannel.mMuteValue);
    return [cusChannelBypassInserts, cusChannelClickPan, cusChanneClickSwitch, cusChannelLevel, cusChannelMute];
};
var PageCue = new LCXLPageTrack("Cue", deviceDriver, lcxlEncoders);
for (var i = 0; i < 4; i++) {
    PageCue.columnAboveButtomBotton(cueChannelColumn(deviceDriver.mSurface, PageCue.page, i), i);
}
for (var i = 4; i < 8; i++) {
    PageCue.columnAboveButtomBotton(cueTrackColumn(deviceDriver.mSurface, PageCue.page, i), i);
}
setTransportEditTrackButtons(PageCue);
