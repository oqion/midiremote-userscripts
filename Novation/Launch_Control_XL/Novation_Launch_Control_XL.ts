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

const expectedName = "Launch Control XL";

// create the device driver main object

const deviceDriver = midiremote_api.makeDeviceDriver(
    'Novation',
     expectedName,
    'Oqion'
  );

//-----------------------------------------------------------------------------
//  Macros

// Does it log? Can't seem to attache the debuger. Since we still have the issue
// with the imports the console here reduces the error to one place in the code.
var doesLog = true;

var LOG = function(logString)
{
    if(doesLog){
        // this line will show as an error. But still works.
        console.log(logString)
    }
}

//-----------------------------------------------------------------------------
// 1. Launch Control - Hardware Class
//-----------------------------------------------------------------------------

class LaunchControlXL {

    static _SystemTemplate = 0xB7;

    static _Template = 0x07;

    static _LightsReset = [this._SystemTemplate, 0x00, 0x00];

    // Enable System flashing.
    static _LightsFlashEnable = [this._SystemTemplate, 0x00, 0x28];

    // System Buffering mutualy exclusive with System Flashing Mode
    static _LightsBufferStart = [this._SystemTemplate, 0x00, 0x31];
    static _LightsBufferFlip = [this._SystemTemplate, 0x00, 0x34];
    static _LightsBufferStop = [this._SystemTemplate, 0x00, 0x30];

    // Direct instintanious control of flash on or off.
    static _LightsFalshOn = [this._SystemTemplate, 0x00, 0x20];
    static _LightsFalshOff = [this._SystemTemplate, 0x00, 0x21];

    // All lights
    static _LightsAllHigh = [this._SystemTemplate, 0x00, 0x7F];
    static _LightsAllMedium = [this._SystemTemplate, 0x00, 0x7E];
    static _LightsAllLow = [this._SystemTemplate, 0x00, 0x7D];

    static _SystemPrefix = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x11]
    static _EncoderSetLEDPrefix = this._SystemPrefix.concat([0x78, this._Template])
    static _EncoderToggleStatePrefix = this._SystemPrefix.concat([0x7B, this._Template])
    static _ToggleOn = 0x7F;
    static _ToggleOff = 0x00;
    static _MessageEnd = 0xF7
    static _TemplateSet = this._SystemPrefix.concat([0x77, this._Template, this._MessageEnd])

    // Use these to address the LCXLs Launchpad interface with the included sysex.
    // place that sysex on user template 8
    // these are also the note addresses for chaning the colours if Launchpad interface is used
    // it is not in this code.
    static CC = {
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
    }
  
      // These allow for the setting of LEDs to the secified colour.

    static Colour = {
        Off: 0x0C, //
        RedLow: 0x0D, //
        RedMed: 0x0E, //
        RedHigh: 0x0F, //
        RedFlash: 0x0B,

        AmberLow: 0x2E, //
        AmberHigh: 0x3F,//
        AmberFlash: 0x3B,

        OrangeLow: 0x1E, //
        OrangeMed: 0x2F, //
        OrangeHigh: 0x1F, //
        OrangeFlash: 0x1B, //

        GreenLow: 0x1C, //
        GreenMed: 0x2C, //
        GreenHigh: 0x3C, //
        GreenFlash: 0x38, 

        Lime: 0x3D, //
        LimeFlash: 0x39, //
        
        YellowLow: 0x1D, //
        YellowMed: 0x2D, //
        YellowHigh: 0x3E, //
        YellowFlash: 0x3A
    }
      
      // When doing direct system addressing the template can be specified.
      // On Cubase we have pages, so this is not likely to be neccisary.
    static Template = {
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
    }
  
      // Use these to address the controls directly using the template ID.
    static EncoderAddress = {
          KnobsTop: [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07],
          KnobsMiddle: [0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F],
          KnobsBottom: [0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17],
          Fader: [0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F], // actualy the top buttons
          ButtonsTop: [0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, 0x1E, 0x1F],
          ButtonsBottom: [0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27],
          ButtonsSide: [0x28, 0x29, 0x2A, 0x2B],
          ButtonUp: 0x2C,
          ButtonDown: 0x2D,
          ButtonLeft: 0x2E,
          ButtonRight: 0x2F,
    }
  
    //   // Iniital colour setting. Copy this to make a map
    // static _InitialColours = {
    //       KnobsTop: [this.Colour.RedLow, this.Colour.RedLow, this.Colour.RedLow, this.Colour.RedLow, 
    //           this.Colour.GreenLow, this.Colour.GreenLow, this.Colour.GreenLow, this.Colour.GreenLow],
    //       KnobsMiddle: [this.Colour.RedLow, this.Colour.RedLow, this.Colour.RedLow, this.Colour.RedLow, 
    //           this.Colour.GreenLow, this.Colour.GreenLow, this.Colour.GreenLow, this.Colour.GreenLow],
    //       KnobsBottom: [this.Colour.AmberLow, this.Colour.AmberLow, this.Colour.AmberLow, this.Colour.AmberLow, this.Colour.AmberLow, this.Colour.AmberLow, this.Colour.AmberLow, this.Colour.AmberLow],
    //       ButtonsTop: [this.Colour.GreenLow, this.Colour.GreenLow, this.Colour.GreenLow, this.Colour.GreenLow, this.Colour.GreenLow, this.Colour.GreenLow, this.Colour.GreenLow, this.Colour.GreenLow],
    //       ButtonsBottom: [this.Colour.AmberLow, this.Colour.AmberLow, this.Colour.AmberLow, this.Colour.AmberLow, this.Colour.AmberLow, this.Colour.AmberLow, this.Colour.AmberLow, this.Colour.AmberLow],
    //       ButtonsSide: [this.Colour.YellowHigh, this.Colour.YellowHigh, this.Colour.YellowHigh, this.Colour.YellowHigh],
    //       ButtonUp: this.Colour.AmberLow,
    //       ButtonDown: this.Colour.AmberLow,
    //       ButtonLeft: this.Colour.AmberLow,
    //       ButtonRight: this.Colour.AmberLow,
    // }

    MIDIIn;
    MIDIOut;
    MIDIChannel;

    constructor(deviceDriver, name) {

        this.MIDIIn = deviceDriver.mPorts.makeMidiInput();;
        this.MIDIOut = deviceDriver.mPorts.makeMidiOutput();

        deviceDriver
        .makeDetectionUnit()
        .detectPortPair(this.MIDIIn, this.MIDIOut)
        .expectOutputNameEndsWith(name)
        .expectInputNameEndsWith(name);

        this.MIDIChannel = 0x0F;
    }

    // Resets all of the the template
    _initReset( activeDevice ) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsReset);
    }

    // Sets the template to user 8
    _initTemplate( activeDevice ) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._TemplateSet);
    }

    // allow lights to be set to flashing colours
    _initFlash( activeDevice ) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsFlashEnable);
    }

    // dissallow lights to be set to flashing colours
    _initFlashDissable( activeDevice ) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsFalshOff);
    }

    // Turn all the LEDs to the highest they will go
    setAllHigh( activeDevice ) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsAllHigh);
    }

    // Turn all the LEDs to  medium
    setAllMed( activeDevice ) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsAllMedium);
    }

    // Turn all the LEDs to  low
    setAllLow( activeDevice ) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsAllLow);
    }

    // TODO: Not sure if the buggering can chang ethe ON colour of a button.
    // Seems like it should work, but the buttons are allways full on (so yellow)
    // this might be do to the host sending 127 and the device responsing
    // as if it were a colour message (as it does). If that is the porblem
    // then the host must be sending the 127 after the note colour message
    // is sent.

    // The Launch Control LX can buffer LED changes and swap them all at once.
    // it has two buffers and writes and displays them interchangably.
    // this method enters that mode
    bufferingStart( activeDevice ) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsBufferStart);
    }

    // The Launch Control LX can buffer LED changes and swap them all at once.
    // it has two buffers and writes and displays them interchangably.
    // this method flips which buffer is being displayed and written to.
    bufferingFlip( activeDevice ) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsBufferFlip);
    }

    // The Launch Control LX can buffer LED changes and swap them all at once.
    // it has two buffers and writes and displays them interchangably.
    // this method exits that mode
    bufferingStop( activeDevice ) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._LightsBufferStop);
    }

    // Set the toggle state of a button to ON IFF it is set to toggle, which it isn't in the default sysex
    setButtonToggleOn(activeDevice, encoderAddress) {
       // sending this message causes Cubase to Hang 
       this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._EncoderToggleStatePrefix.concat([encoderAddress, LaunchControlXL._ToggleOn, LaunchControlXL._MessageEnd]));
    }

    // Set the toggle state of a button to OFF IFF it is set to toggle, which it isn't in the default sysex
    setButtonToggleOff(activeDevice, encoderAddress) {
        // sending this message causes Cubase to Hang 
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._EncoderToggleStatePrefix.concat([encoderAddress, LaunchControlXL._ToggleOff, LaunchControlXL._MessageEnd]));
    }

    //9nh, Note, Velocity

    // Sets the LED colour of a specific widget (Knob or Button)
    setEncoderColour( activeDevice, encoderAddress, colour ) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._EncoderSetLEDPrefix.concat([encoderAddress,colour, LaunchControlXL._MessageEnd]));
    }

    setOff( activeDevice, encoderAddress ) {
        this.MIDIOut.sendMidi(activeDevice, LaunchControlXL._EncoderSetLEDPrefix.concat([encoderAddress,LaunchControlXL.Colour.Off, LaunchControlXL._MessageEnd]));
    }

    // Sets the LED colour of a specific widget (Knob or Button)
    setEncoderColourByNote( activeDevice, CC, colour ) {
        this.MIDIOut.sendMidi(activeDevice, this.MIDIChannel, CC, colour);
    }

    // Takes a map of all of the widgets and set's the colours accordingly.
    setColourMap( activeDevice, colourMap ) {
        for(var i = 0; i < 8; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsTop[i], colourMap.KnobsTop[i]);
        }
        for(var i = 0; i < 8; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsMiddle[i], colourMap.KnobsMiddle[i]);
        }
        for(var i = 0; i < 8; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsBottom[i], colourMap.KnobsBottom[i]);
        }
        for(var i = 0; i < 8; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonsTop[i], colourMap.ButtonsTop[i]);
        }
        for(var i = 0; i < 8; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonsBottom[i], colourMap.ButtonsBottom[i]);
        }
        for(var i = 0; i < 4; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonsSide[i], colourMap.ButtonsSide[i]);
        }
        this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonUp, colourMap.Up);
        this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonDown, colourMap.Down);
        this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonLeft, colourMap.Left);
        this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.ButtonRight, colourMap.Right);
    }

    // sets the upper LEFT 8 knob colours from an array of 8. Usefull when using Quick Controls in 
    // 2x4 groups rather than 1x8 line.
    setUpperKnobsLeft( activeDevice, colourArray ) {
        for(var i = 0; i < 4; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsTop[i], colourArray.KnobsTop[i]);
        }
        for(var i = 0; i < 4; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsMiddle[i], colourArray.KnobsMiddle[3 + i]);
        }
    }

    // sets the upper RIGHT 8 knob colours from an array of 8. Usefull when using Quick Controls in 
    // 2x4 groups rather than 1x8 line.
    setUpperKnobsRight( activeDevice, colourArray ) {
        for(var i = 0; i < 4; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsTop[3 + i], colourArray.KnobsTop[i]);
        }
        for(var i = 0; i < 4; ++i) {
            this.setEncoderColour(activeDevice, LaunchControlXL.EncoderAddress.KnobsMiddle[3 + i], colourArray.KnobsMiddle[3 + i]);
        }
    }

    // Initialize the state of the Launch XOntrol XL so that it is on the correct template
    // and all of the lights are on.
    initialize(activeDevice){
        this._initTemplate(activeDevice);
        this._initReset(activeDevice);
        // this.setColourMap(activeDevice, LaunchControlXL._InitialColours);
        this.bufferingStop(activeDevice);
        this._initFlashDissable(activeDevice);
    }

    getMidiBindings() {
        var midiMap = []
        function pushCC(CC) {
            midiMap.push({type: 'CC', value: CC})
        }
        var cc = LaunchControlXL.CC
        cc.KnobsTop.forEach(pushCC)
        cc.KnobsMiddle.forEach(pushCC)
        cc.KnobsBottom.forEach(pushCC)
        cc.Fader.forEach(pushCC)
        cc.ButtonsTop.forEach(pushCC)
        cc.ButtonsBottom.forEach(pushCC)
        cc.ButtonsSide.forEach(pushCC)
        midiMap.push(cc.ButtonUp)
        midiMap.push(cc.ButtonDown)
        midiMap.push(cc.ButtonLeft)
        midiMap.push(cc.ButtonRight)
    }

    makeKnob(address, cc, row, column){
        return new LCXLKnob(this, address, cc, row, column);
    }

    makeFader(address, cc, row, column){
        return new LCXLFader(this, address, cc, row, column);
    }

    makeButton(address, cc, row, column){
        return new LCXLButton(this, address, cc, row, column);
    }

    makeDirectionButton(address, cc, row, column){
        return new LCXLDirectionButton(this, address, cc, row, column);
    }

    makeSideButton(address, cc, row){
        return new LCXLSideButton(this, address, cc, row);
    }

    // TODO: Make this so that it can make more than one with a different MIDI Channel and screen position
    // need to respond to Bank change message 
    // need to configure screen position
    // Need to make 7 more sysex, and also save them to send to the device. 8-14
    // That way multiple user templates could be used at the same time.
    // Figure out if the syx can be sent directly from this script. MR can do that
    // but Novation has some special way it has to be done.
    makeEncoders(surface){
        return new LCXLEncoders(this, surface);
    }
}

const Red = {high: LaunchControlXL.Colour.RedHigh,
    med: LaunchControlXL.Colour.RedMed,
    low: LaunchControlXL.Colour.RedLow,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.RedFlash,
}

const Green = {high: LaunchControlXL.Colour.GreenHigh,
    med: LaunchControlXL.Colour.GreenMed,
    low: LaunchControlXL.Colour.GreenLow,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.GreenFlash,
}

const Yellow = {high: LaunchControlXL.Colour.YellowHigh,
    med: LaunchControlXL.Colour.YellowMed,
    low: LaunchControlXL.Colour.YellowLow,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.YellowFlash,
}

const Amber = {high: LaunchControlXL.Colour.AmberHigh,
    med: LaunchControlXL.Colour.AmberLow,
    low: LaunchControlXL.Colour.AmberLow,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.AmberFlash,
}

const Orange = {high: LaunchControlXL.Colour.OrangeHigh,
    med: LaunchControlXL.Colour.OrangeLow,
    low: LaunchControlXL.Colour.OrangeLow,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.OrangeFlash,
}

const Lime = {high: LaunchControlXL.Colour.Lime,
    med: LaunchControlXL.Colour.Lime,
    low: LaunchControlXL.Colour.Lime,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.LimeFlash,
}

const Inactive = {high: LaunchControlXL.Colour.Off,
    med: LaunchControlXL.Colour.Off,
    low: LaunchControlXL.Colour.Off,
    off: LaunchControlXL.Colour.Off,
    flash: LaunchControlXL.Colour.Off,
}

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


class EventManager {
    pagename;
    functorEventDisplayValueChange;
    functorEventHostTitle;
    functorEventProcessValueChange;
    constructor(pagename) {
        this.pagename = pagename;
        this.functorEventDisplayValueChange = null;
        this.functorEventHostTitle = null;
        this.functorEventProcessValueChange = null;
    }
}

// Will also set a variable to control it. Only allowing
// one per page per encoder, overwriting if already registered.
abstract class PageAwareEncoder {
    element;
    eventManagers;
    eventDisplayValueChangeRegistered;
    eventHostTitleRegistered;
    eventProcessValueChangeRegistered;
    currentpage;
    functorDisplayValueChange;
    functorHostTitle;
    functorProcessValueChange;
    
    constructor() {
        this.element = null;
        this.eventManagers = {};
        this.eventDisplayValueChangeRegistered = false;
        this.eventHostTitleRegistered = false;
        this.eventProcessValueChangeRegistered = false;
        this.currentpage = "";
        this.functorDisplayValueChange = null;
        this.functorHostTitle = null;
        this.functorProcessValueChange = null;
    }

    resetPage(name) {
        this.currentpage = name;
        this._setFunctorTitleChange();
        this._setFunctorDisplayValueChanged();
        this._setFunctorProcessValueChanged();
    }

   _getEventManager(pageName) {
       var eventManager = this.eventManagers[pageName];
       var isUndefined = "" + typeof eventManager;
       if (isUndefined == "undefined") {
           return null;
       }
       return eventManager;
   }

   _makeEventManagerIfNeeded(pageName) {
       var eventManager = this._getEventManager(pageName);
       if (null == eventManager) {
           eventManager = new EventManager(pageName);
           this.eventManagers[pageName] = eventManager;
       }
       return eventManager;
   }

   registerEventDisplayValueChange(pageName, functor){
       // LOG("registerEventDisplayValueChange: " + this.cc + " for page: " + pageName);
       var eventManager = this._makeEventManagerIfNeeded(pageName);
       eventManager.functorEventDisplayValueChange = functor;
       if( this.eventDisplayValueChangeRegistered == false) {
           this.eventDisplayValueChangeRegistered = true;
           this.element.mSurfaceValue.mOnDisplayValueChange = 
           function(activeDevice, valueString) {
               this._handleDisplayValueChanged(activeDevice, valueString);
           }.bind(this);
       }
   }
   
   registerEventHostTitle(pageName, functor){
       // LOG("registerEventHostTitle: " + this.cc + " for page: " + pageName);
       var eventManager = this._makeEventManagerIfNeeded(pageName);
       eventManager.functorHostTitle = functor;
       if( this.eventHostTitleRegistered == false) {
           this.eventHostTitleRegistered = true;
           this.element.mSurfaceValue.mOnTitleChange = 
           function (activeDevice, value, units) {
                   this._handleTitleChange(activeDevice, value, units);
           }.bind(this);
       }
   }

   registerEventProcessValueChange(pageName, functor){
       // LOG("registerEventProcessValueChange: " + this.cc + " for page: " + pageName)
       var eventManager = this._makeEventManagerIfNeeded(pageName);
       eventManager.functorProcessValueChange = functor;
       if( this.eventProcessValueChangeRegistered == false) {
           this.eventProcessValueChangeRegistered = true;
           this.element.mSurfaceValue.mOnProcessValueChange = 
           function(activeDevice, value) {
               this._handleProcessValueChanged(activeDevice, value);
           }.bind(this);
       }
   }

   _setFunctorTitleChange() {
       this.functorHostTitle = null;
       var eventManager = this._getEventManager(this.currentpage);
       if(null != eventManager) {
           this.functorHostTitle = eventManager.functorHostTitle;
       }
   }

   _setFunctorDisplayValueChanged(){
       this.functorDisplayValueChange = null;
       var eventManager = this._getEventManager(this.currentpage);
       if(null != eventManager) {
           this.functorDisplayValueChange = eventManager.functorEventDisplayValueChange;
       }
   }

   _setFunctorProcessValueChanged(){
       this.functorProcessValueChange = null;
       var eventManager = this._getEventManager(this.currentpage);
       if(null != eventManager) {
           this.functorProcessValueChange = eventManager.functorProcessValueChange;
       }
   }

   _handleTitleChange(activeDevice, value, units) {
       if(null != this.functorHostTitle) {
          this.functorHostTitle(activeDevice, value, units);
       }
   }

   _handleDisplayValueChanged(activeDevice, valueString){
       if(null != this.functorDisplayValueChange) {
           this.functorDisplayValueChange(activeDevice, valueString);
       }
   }

   _handleProcessValueChanged(activeDevice, value){
       if(null != this.functorProcessValueChange) {
           this.functorProcessValueChange(activeDevice, value);
       }
   }
}

abstract class LCXLEncoderAbstract extends PageAwareEncoder {
    address;
    cc;
    device;
    width;
    height;
    row;
    column;

    constructor(device, address, cc, width, height, row, column) {
        super();
        this.width = width;
        this.height = height;
        this.row = row;
        this.column = column;
        this.address = address;
        this.cc = cc;
        this.device = device;
    }

    setColour( activeDevice, colour ) {
        this.device.setEncoderColour( activeDevice, this.address, colour );
        //this.device.setEncoderColourByNote(activeDevice, this.cc, colour)
    }

    turnOff( activeDevice ) {
        this.device.setOff( activeDevice, this.address,);
    }

    initSurface(surface) {
            this.element = this.makeElement(surface, this.column, this.row);
            this.element.mSurfaceValue.mMidiBinding
            .setInputPort(this.device.MIDIIn)
            .setOutputPort(this.device.MIDIOut)
            .bindToControlChange(this.device.MIDIChannel, this.cc)
    }

    abstract makeElement(surface, column, row);

}


class LCXLKnob extends LCXLEncoderAbstract
{
    static width = 2
    static height = 2;
    constructor(device, address, cc, row, column) {
        super(device, address, cc, LCXLKnob.width, LCXLKnob.height, row, LCXLKnob.width * column);
    }

    makeElement(surface, column, row) {
        return surface.makeKnob(column, row, this.width, this.height);
    }
    
}

class LCXLFader extends LCXLEncoderAbstract
{
    static width = 2
    static height = 6;
    constructor(device, address, cc, row, column) {
        super(device, address, cc, LCXLFader.width, LCXLFader.height, row, LCXLFader.width * column);
    }

    makeElement(surface, column, row) {
        return surface.makeFader(column, row, this.width, this.height);
    }

    setColour( activeDevice, colour ) {
        // This could be used to set the colour of the buttton bellow it
        // If this is removed and care is taken to not write the colour to the button.
        // But for now this is my own little Liskov, as this type shouldn't have to      
        // override it's parent.   
    }

    turnOff( activeDevice ) {
    }
}

class LCXLButton extends LCXLEncoderAbstract
{
    static width = 2
    static height = 1;
    constructor(device, address, cc, row, column) {
        super(device, address, cc, LCXLButton.width, LCXLButton.height, row, LCXLButton.width * column);
    }

    makeElement(surface, column, row) {
        return surface.makeButton(column, row, this.width, this.height);
    }
}

class LCXLSideButton extends LCXLEncoderAbstract
{
    static width = 1
    static height = 1;
    constructor(device, address, cc, row) {
        super(device, address, cc, LCXLSideButton.width, LCXLSideButton.height, 
            LCXLKnob.height * 3 + row + 0.5 * row  , LCXLButton.width * 8 + 0.75
            );
    }

    makeElement(surface, column, row) {
        return surface.makeButton(column, row, this.width, this.height);
    }
}

class LCXLDirectionButton extends LCXLEncoderAbstract
{
    static width = 1
    static height = 1;
    constructor(device, address, cc, row, column) {
        super(device, address, cc, LCXLDirectionButton.width, LCXLDirectionButton.height, 
            LCXLKnob.height * row + 0.2, 
            LCXLFader.width * 8 + 0.25 + LCXLDirectionButton.width * column
            );
    }

    makeElement(surface, column, row) {
        return surface.makeButton(column, row, this.width, this.height);
    }

}

class LCXLEncoders {

    knobsTop;
    upButton;
    downButton;
    leftButton;
    rightButton;
    sideButtons;
    knobsMiddle;
    knobsBottom;
    faders;
    buttonsTop;
    buttonsBottom;

    constructor( launchControlXL, surface) {

        this.knobsTop = [];
        for(var i = 0; i < 8; ++i) {
            this.knobsTop.push( launchControlXL.makeKnob( 
                LaunchControlXL.EncoderAddress.KnobsTop[i], LaunchControlXL.CC.KnobsTop[i], 0, i));
        }

        this.upButton = launchControlXL.makeDirectionButton(LaunchControlXL.EncoderAddress.ButtonUp, LaunchControlXL.CC.ButtonUp, 1, 0);
        this.downButton = launchControlXL.makeDirectionButton(LaunchControlXL.EncoderAddress.ButtonDown, LaunchControlXL.CC.ButtonDown, 1, 1);
        this.leftButton = launchControlXL.makeDirectionButton(LaunchControlXL.EncoderAddress.ButtonLeft, LaunchControlXL.CC.ButtonLeft, 2, 0);
        this.rightButton = launchControlXL.makeDirectionButton(LaunchControlXL.EncoderAddress.ButtonRight, LaunchControlXL.CC.ButtonRight, 2, 1);

        this.sideButtons = [];
        for(var i = 0; i < 4; ++i) {
            this.sideButtons.push( launchControlXL.makeSideButton( 
                LaunchControlXL.EncoderAddress.ButtonsSide[i], LaunchControlXL.CC.ButtonsSide[i], i));
        }

        this.knobsMiddle = [];
        for(var i = 0; i < 8; ++i) {
            this.knobsMiddle.push( launchControlXL.makeKnob( 
                LaunchControlXL.EncoderAddress.KnobsMiddle[i], LaunchControlXL.CC.KnobsMiddle[i], LCXLKnob.height, i));
        }

        this.knobsBottom = [];
        for(var i = 0; i < 8; ++i) {
            this.knobsBottom.push( launchControlXL.makeKnob( 
                LaunchControlXL.EncoderAddress.KnobsBottom[i], LaunchControlXL.CC.KnobsBottom[i], LCXLKnob.height * 2, i));
        }
        
        this.faders = [];
        for(var i = 0; i < 8; ++i) {
            this.faders.push( launchControlXL.makeFader( 
                LaunchControlXL.EncoderAddress.Fader[i], LaunchControlXL.CC.Fader[i], LCXLKnob.height * 3, i));
        }

        this.buttonsTop = [];
        for(var i = 0; i < 8; ++i) {
            this.buttonsTop.push( launchControlXL.makeButton( 
                LaunchControlXL.EncoderAddress.ButtonsTop[i], LaunchControlXL.CC.ButtonsTop[i], LCXLKnob.height * 3 + LCXLFader.height, i));
        }

        this.buttonsBottom = [];
        for(var i = 0; i < 8; ++i) {
            this.buttonsBottom.push( launchControlXL.makeButton( 
                LaunchControlXL.EncoderAddress.ButtonsBottom[i], LaunchControlXL.CC.ButtonsBottom[i], LCXLKnob.height * 3 + LCXLFader.height + LCXLButton.height, i));
        }

        this.initSurface(surface)
    }

    initSurface(surface) {
        var init = function(encoder){encoder.initSurface(surface)}.bind(this);
        this.knobsTop.forEach(init);
        this.knobsMiddle.forEach(init);
        this.knobsBottom.forEach(init);
        this.buttonsTop.forEach(init);
        this.buttonsBottom.forEach(init);
        this.faders.forEach(init);
        this.sideButtons.forEach(init);
        this.upButton.initSurface(surface)
        this.downButton.initSurface(surface)
        this.leftButton.initSurface(surface)
        this.rightButton.initSurface(surface)
    }
}

//-----------------------------------------------------------------------------
// 3. Launch Control - Controller
//-----------------------------------------------------------------------------

// First pass at event based model. Needs refactoring to "move up" an event based cleass
class LCXLController {
    encoder;
    colour;

    registerEventHostTitle;
    registerEventDisplayValueChange;
    registerEventProcessValueChange;

    // To get around Liskov with bindings : this does stovepipe the controller
    // especialy Variable. However, making a Binding class 
    // with (Pickup, Scalled, Jump, Command, and Action extentions), means
    // either putting this feature on to the eventual page definition DSL or
    // making convenience functions for the same. Not to mention the complexity
    // So as far as the user is concerned it's only a mater of which side of the 
    // constructors closing brace the difference is specified. 
    bindingObject;
    mode;
    bindingType;
    bindingMode;

    toggle; 
    invert;

    isActive;

    constructor(colour, mode = null){
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
    resetEncoder(name) {
        this.encoder.resetPage(name);
    }

    reset(activeDevice) {
        // LOG(" ---- Reseting Controller:" + this.encoder.cc + " isActive: " + this.isActive)
        if(this.isActive == true)
        {
            this.encoder.setColour(activeDevice, this.colour.low);
        } else {
            this.encoder.setColour(activeDevice, this.colour.off);
        }
    }

    deactivate(activeDevice)
    {
        this.isActive = false;
        this.reset(activeDevice);
    }

    activate(activeDevice)
    {
        this.isActive = true;
        this.reset(activeDevice);
    }

    // Do to the Liskov issue and that we have to get the setting FROM THE PAGE
    // we have to duplicate the Cubase pattern. We can't just pass what to do to
    // the constructor.

    action(binding)
    {   
        // LOG("action: " + typeof binding)
        this.bindingObject = binding;
        this.bindingType = "action";
        return this;
    }

    value(binding)
    {
        // LOG("value: " + typeof binding)
        this.bindingObject = binding;
        this.bindingType = "value";
        return this;
    }

    command(commandCategory, commandName)
    {
        this.bindingObject = [commandCategory, commandName];
        this.bindingType = "command";
        return this;
    }

    // late initialization of encoder so it doesn't have to be passed to the LCXLPage.
    // though additional encoders may be needed in extended constructors. This one
    // is always the focus that supplies the bindable.
    bindEncoder(pageName, page, encoder) {
        this.encoder = encoder;
        var bindable = encoder.element.mSurfaceValue;
        var binding = null;

        if(this.bindingType == 'value') {
            binding = this._value(page, this.bindingObject, bindable);
        }
        else if(this.bindingType == 'action') {
            binding = this._action(page, this.bindingObject, bindable);
        }
        else if(this.bindingType == 'command') {
            binding = this._command(page, this.bindingObject, bindable);
        }

        if(binding != null && this.invert == true)
        {
            binding.mapToValueRange(1,0)
        }

        this._registerEventDisplayValueChange(pageName);
        this._registerEventHostTitle(pageName);
        this._registerEventProcessValueChange(pageName); 

        // TODO: One would not thing that holding on to the binding 
        // should cuase any problems, but it's been learn as you go, and there
        // were performance issues early on, and this seemed to fix them.
        // Taking it out again is something to test.
        this.bindingObject = null;
    }

    // Do to the Liskov issue and that we have to get the setting FROM THE PAGE
    // we have to duplicate the Cubase pattern. 

    _action(page, binding, bindable)
    {
        return page.makeActionBinding(bindable, binding);     
    }

    _command(page, binding, bindable) {
       
        return page.makeCommandBinding(bindable, binding[0], binding[1]);
    }

    _value(page, binding, bindable) {
        var valueBinding = page.makeValueBinding(bindable, binding);

        if( null != this.mode){
            if( this.mode == "pickup")
            {
                valueBinding.setValueTakeOverModePickup(); 
            }
            else if( this.mode == "scaled")
            {
                valueBinding.setValueTakeOverModeScaled();
            }
            else if (this.mode == "jump")
            {
                valueBinding.setValueTakeOverModeJump();
            }
        }

        if(this.toggle == true) 
        {
            valueBinding.setTypeToggle();
        }
        return valueBinding;       
    }


    _registerEventDisplayValueChange(pageName){
        if(this.registerEventDisplayValueChange){
            this.encoder.registerEventDisplayValueChange( pageName,
                function(activeDevice, valueString) {
                    this.handleDisplayValueChanged(activeDevice, valueString);
                }.bind(this));
        }
    }
    
    _registerEventHostTitle(pageName){
        if(this.registerEventHostTitle){
            this.encoder.registerEventHostTitle(pageName,
            function(activeDevice, value, units) {
                    this.handleTitleChange(activeDevice, value, units);
                }.bind(this));
        }
    }

    _registerEventProcessValueChange(pageName){
        if(this.registerEventProcessValueChange) {
            this.encoder.registerEventProcessValueChange(pageName, 
            function(activeDevice, value) {
                this.handleProcessValueChanged(activeDevice, value);
            }.bind(this));
        }
    }

    handleTitleChange(activeDevice, value, units) {}

    handleDisplayValueChanged(activeDevice, valueString){}

    handleProcessValueChanged(activeDevice, value){}
}

//-----------------------------------------------------------------------------
// 4. Controller Library
//-----------------------------------------------------------------------------

// Controls a variable in any mode. Dims the LED when not captured
// Defaults tp pickup mode.
class Variable extends LCXLController {
    registerEventsEncoder;

    encoderPosition;
    displayValue;
    hostChangedWhenEncoderDidnt;

    encoderSensitivity;

    constructor(colour, mode = "pickup"){
        super(colour, mode);

        this.registerEventHostTitle = true;
        this.registerEventDisplayValueChange = true;
        this.registerEventProcessValueChange = true;

        this.registerEventsEncoder = false;

        this.encoderPosition = 0;
        this.displayValue = "";
        this.hostChangedWhenEncoderDidnt = 1;
        
        this.encoderSensitivity = .005 // .5
    }
    
    evalEncoderSensitivity(encoderChange){
        if(this.encoderSensitivity == 0)
        {
            return true; 
        }
        return encoderChange < (0-this.encoderSensitivity) || encoderChange > this.encoderSensitivity
    }

    handleTitleChange(activeDevice, value, units) {
        // if(this.encoder.cc == 17) {
        // LOG("TTTTTTTTTTT handleTitleChange value: " + value + " units: " + units)
        // LOG("TTTTTTTTTTT cc: " + this.encoder.cc + " hostChange: " + this.hostChangedWhenEncoderDidnt);}
        this.hostChangedWhenEncoderDidnt = 2;
        this.eventHostDifferent(activeDevice, value);
    }

    handleDisplayValueChanged(activeDevice, valueString){
        // var oldDisplayValue = this.displayValue;
        // if(this.encoder.cc == 17) {
        // LOG("DDDDDDDDDDD handleDisplayValueChanged value: " + valueString + " oldDisplayValue: " + oldDisplayValue);
        // LOG("DDDDDDDDDDD cc: " + this.encoder.cc + " hostChange: " + this.hostChangedWhenEncoderDidnt);}
        
        this.displayValue = valueString;
        if( this.hostChangedWhenEncoderDidnt == 0 ) {
            this.eventHostLikelySame(activeDevice, valueString, this.encoderPosition);
        }
        
    }

    handleProcessValueChanged(activeDevice, value){
        var oldValue = this.encoderPosition;
        // if(this.encoder.cc == 17) {
        // LOG("PPPPPPPPPPP handleProcessValueChanged value: " + value + " oldValue: " + oldValue);
        // LOG("PPPPPPPPPPP cc: " + this.encoder.cc + " hostChange: " + this.hostChangedWhenEncoderDidnt);}

        this.encoderPosition = value;

        if( oldValue == value ) {

            if( this.hostChangedWhenEncoderDidnt > 2 ) {
                this.eventHostDifferent(activeDevice, value);
            } 

            this.hostChangedWhenEncoderDidnt++;

        } else 

            this.hostChangedWhenEncoderDidnt = 0;

            if( this.registerEventsEncoder ) {

                var encoderChange = value - oldValue;
                if( this.evalEncoderSensitivity(encoderChange) ) {               
                    this.eventEncoderChanged(activeDevice, value, encoderChange);
            }
        }
        
    }

    eventHostLikelySame(activeDevice, valueString, value) {
        // LOG("---------- eventHostLikelySame valueString: " + valueString );
        this.encoder.setColour(activeDevice, this.colour.high)
    }

    eventHostDifferent(activeDevice, value) {
        // LOG("---------- eventHostDifferent value " + value);
        this.encoder.setColour(activeDevice, this.colour.low);
    }

    eventEncoderChanged(activeDevice, value, encoderChange){}
}


//Convenience to not have to use a string to have a jump mode variable.
class VariableJump extends Variable {

    constructor(colour){
        super(colour, "Jump");
    }
}

//Convenience to not have to use a string to have a scaled mode variable.
class VariableScaled extends Variable {

    constructor(colour){
        super(colour, "scaled");
    }
}


// There are NO events to tell us when the host changed
// so if one of the functions in this commander changes state
// there is no way to know, and any encoder dependent on it will
// be in an incorrect state until it cycles through the difference.
// The use case is for example the preFilter which turns on and off
// as a VariableSwitch. But once on, if you turn it off in the host
// the light can not reflect this.
// Will however, trigger all of the actions commands or boolean values
// that are added wiht triggerAll, or one at a time with trigger(i)
class Commander {
    elements;
    name;
    constructor(name) {
        this.name = name;
        this.elements = [];
    }

    length() {
        return this.elements.length;
    }

    addTriggerValue(surface, page, binding) {     
        var element = surface.makeCustomValueVariable(this.name + this.elements.length);
        // LOG("value- " + JSON.stringify(element))
        page.makeValueBinding(element, binding).setTypeToggle();
        this.elements.push(element);
        return this;
    }

    addTriggerCommand(surface, page, commandCategory, commandName) {
        var element = surface.makeCustomValueVariable(this.name + this.elements.length);
        // LOG("command- " + JSON.stringify(element))
        page.makeCommandBinding(element, commandCategory, commandName);
        this.elements.push(element);
        return this;
    }

    addTriggerAction(surface, page, binding) {
        var element = surface.makeCustomValueVariable(this.name + this.elements.length);
        // LOG("action- " + JSON.stringify(element))
        page.makeActionBinding(element, binding);
        this.elements.push(element);
        return this;
    }

    triggerOff(activeDevice)
    {
        this.triggerAll(activeDevice, 0)
    }

    trigger(activeDevice, index = 0, value = 1) {
        var element = this.elements[index];
        //  LOG("triggering: " + element + " " + i + " value: " + value)
        this.elements[index].setProcessValue(activeDevice, value)
    }

    triggerAll(activeDevice, value = 1){
        // LOG("trigger: " + this.elements.length )
        for( var i = 0; i < this.elements.length; i++) {
            this.trigger(activeDevice, i, value);
        }
    }
}

// switch it on, and then it is a variable.
class VariableSwitch extends Variable {

    triggerWhen;
    commander;
    isOn;
    constructor(colour, commander, triggerWhen=null, mode="scaled") {
        super(colour, mode);
        this.triggerWhen = triggerWhen
        this.commander = commander;
        this.isOn = false;
    }

    eventHostLikelySame(activeDevice, valueString, value) {
        // LOG("---------- VariableSwitch eventHostLikelySame valueString: " + valueString + " value: " + value);
        if(valueString != this.triggerWhen)
        {   
            // LOG("trigger on: " + this.isOn)
            if(! this.isOn) {
                this.isOn = true;
                this.commander.triggerAll(activeDevice);
            }
            this.encoder.setColour(activeDevice, this.colour.high)
        }
        else if(valueString == this.triggerWhen && this.isOn)
        {
            // LOG("trigger off " + this.isOn)
            this.isOn = false;
            this.commander.triggerOff(activeDevice);
            this.encoder.setColour(activeDevice, this.colour.off)
        }
    }

    eventHostDifferent(activeDevice, value) {
        // LOG("----------  VariableSwitcheventHostDifferent value " + value);
        this.encoder.setColour(activeDevice, this.colour.low);
    }

}

// controls a knob or slider used to slect multiple options.
class Options extends LCXLController {
    count;
    colours;
    slices;
    defaultColour;
    lastSlice;
    constructor(defaultColour, colours){
        super(Inactive, "jump");
        this.count = colours.length;
        this.colours = colours;
        this.defaultColour = defaultColour;
        this.slices = []
        this.registerEventProcessValueChange = true;
        this.lastSlice = -1;

        var size = 1/this.count;
        for(var i = 0; i < this.count; i++)
        {
            this.slices.push( (i+1) * size);
        }
    }

    reseet(activeDevice) {
        if(this.isActive == true) {
            this.encoder.setColour(activeDevice, this.defaultColour);
        } else {
            this.encoder.setOff(activeDevice);
        }
    }

    eventIndexSelected(activeDevice, i) {
        this.encoder.setColour(activeDevice, this.colours[i]);
    }

    handleProcessValueChanged(activeDevice, value){
        //LOG("---------- Options handleProcessValueChanged value: " + value);
        for(var i=0; i < this.count; i++) {
            if(value <= this.slices[i] || i == this.count-1) {
                this.lastSlice = i;
                this.eventIndexSelected(activeDevice, i);
                break;
            }
        }
    }
}

// controls a knob or slider used to slect multiple options.
class OptionsTrigger extends LCXLController {
    count;
    downCommands;
    upCommands;
    slices;
    lastSlice;
    constructor(colour, downCommands, upCommands, count=127){
        super(colour, "jump");
        this.downCommands = downCommands;
        this.upCommands = upCommands;
        this.slices = []
        this.registerEventProcessValueChange = true;
        if( count > 127 || count < 0)
        {
            count = 127;
        }
        this.count = count;
        this.lastSlice = -1;

        var size = 1/this.count;
        for(var i = 0; i < this.count; i++)
        {
            this.slices.push( (i+1) * size);
        }
    }

    handleProcessValueChanged(activeDevice, value){
        // LOG("---------- OptionsTrigger handleProcessValueChanged value: " + value);
        var sliceNow = 0;
        for(var i=0; i < this.count; i++) {
            if(value <= this.slices[i] || i == this.count-1) {
                sliceNow = i;
                break;
            }
        }

        // LOG("---------- OptionsTrigger sliceNow: " + sliceNow);
        // LOG("---------- OptionsTrigger lastSlice: " + this.lastSlice);

        if( sliceNow < this.lastSlice)
        {
            var difference = this.lastSlice - sliceNow;
            // LOG("---------- OptionsTrigger sliceNow < this.lastSlice difference:" + difference);

            for(var i=0; i < difference; i++)
            {
                this.downCommands.triggerAll(activeDevice)
            }
        } else if( sliceNow > this.lastSlice)
        {
            var difference =  sliceNow - this.lastSlice;
            // LOG("---------- OptionsTrigger sliceNow > this.lastSlice difference:" + difference);

            for(var i=0; i < difference; i++)
            {
                this.upCommands.triggerAll(activeDevice)
            }
        }

        this.lastSlice = sliceNow;
    }
}

// Like Options, but manipulates another encoder's colour used to change the colour of
// an LED based on a Glide (fader) which doesn't have it's own LED.
class OptionsManipulator extends LCXLController {

    count;
    colours;
    displayValues;
    defaultColour;
    manipulatedController;
    constructor(defaultColour, colours, displayValues, manipulatedController, mode = "scaled"){
        super(Inactive, mode);
        this.count = colours.length;
        this.colours = colours;
        this.defaultColour = defaultColour;
        this.displayValues = displayValues;
        this.registerEventDisplayValueChange = true;
        this.manipulatedController = manipulatedController;
        this.manipulatedController.colour = this.defaultColour
    }


    reset(activeDevice) {
        super.reset(activeDevice);
        this.manipulateColour(activeDevice, this.defaultColour);
    }

    manipulateColour(activeDevice, colour) {
        this.manipulatedController.colour = colour;
        this.manipulatedController.reset(activeDevice)
    }

    handleDisplayValueChanged(activeDevice, valueString){
        // LOG("OptionsManipulator handleDisplayValueChanged - valueString: " + valueString)
        for(var i=0; i < this.count; i++) {
            if(valueString == this.displayValues[i]) {
                this.manipulateColour(activeDevice, this.colours[i]);
                break;
            }
        }
    }
}

// Controls a knob or slider used as a switch. Always in jump mode.
class Switch extends LCXLController {
    onColour;
    offColour;
    onTrigger;
    isOn;
    constructor(onColour, offColour, onTrigger = "On") {
        super(Inactive, "jump");
        this.isOn =false;
        this.onColour = onColour;
        this.offColour = offColour;
        this.onTrigger = onTrigger;
        this.registerEventDisplayValueChange = true;
    }

    reset(activeDevice) {
        if(this.isActive == true)
        {
            if(this.isOn == true)
            {
                this.encoder.setColour(activeDevice, this.onColour);
            } else {
                this.encoder.setColour(activeDevice, this.offColour);
            }
        } else {
            this.encoder.setColour(activeDevice, this.colour.off);
        }
    }

    handleDisplayValueChanged(activeDevice, valueString){
        // LOG("---------- SWITCH handleDisplayValueChanged value: " + valueString );
        this.isOn = (valueString == this.onTrigger);
        this.reset(activeDevice);   
    }
}

// controls a knob or fader defaults to scaled mode.
// Likely used for a fader as there is no feedback, and 
// LCXL has no LED feedback on faders. Scalled works better for 
// faders.
class Glide extends LCXLController {

    constructor(colour = Inactive, mode = "scaled"){
        super(colour, mode);
    }
}

// Intended to control a button that toggles between two states.
// always in jump mode for this to function properly

// TODO: Fix defect where LCXL always shows bright yellow
// when toggle is ON. Tried LCXL buffering and fliping
// On is allways yellow.
class Toggle extends LCXLController {

    constructor(colour){
        super(colour, "jump");
        this.registerEventProcessValueChange = true;
        this.toggle = true;
    }

    handleProcessValueChanged(activeDevice, value){
        // LOG("---------- Toggle handleProcessValueChanged value: " + value);

        if(value == "1") { // On
            // LOG("HIGH")
            this.encoder.setColour(activeDevice, this.colour.low)
        }
        else {
           // LOG("LOW") // Off
            this.encoder.setColour(activeDevice,  this.colour.high)
        }
    }
}

class InvertedToggle extends Toggle {
    constructor(colour){
        super(colour);
        this.invert = true;
    }
}

// Toggle that also can deactivate another controller's LEDs (turn them off)
class ToggleActivator extends Toggle {
    targetController;
    constructor(colour, targetController){
        super(colour);
        this.targetController = targetController;
    }

    handleProcessValueChanged(activeDevice, value){
        super.handleProcessValueChanged(activeDevice, value)

        if(value != "1") { // off
            this.targetController.deactivate(activeDevice);
        }
        else{
            this.targetController.activate(activeDevice);
        }
    }
}

// Intended to be used with a button.
// A one time trigger typically used for actions and commands.
class Trigger extends LCXLController {

    constructor(colour){
        super(colour, "jump");
        this.toggle = false;
        this.registerEventProcessValueChange = true;
    }

    handleProcessValueChanged(activeDevice, value){
        //LOG("---------- Press handleProcessValueChanged value: " + value );
        if(value == 1)
        {
            this.encoder.setColour(activeDevice, this.colour.high)
        }
        else
        {
            this.encoder.setColour(activeDevice, this.colour.low)
        }
    }

}

//-----------------------------------------------------------------------------
// 5. Launch Control - Page
//-----------------------------------------------------------------------------


class LCXLPage {

    _knobsTop;
    _upButton;
    _downButton;
    _leftButton;
    _rightButton;
    _sideButtons;
    _knobsMiddle;
    _knobsBottom;
    _faders;
    _buttonsTop;
    _buttonsBottom;
    page;
    encoders;
    name;

    constructor(name: string, deviceDriver, encoders: LCXLEncoders) {
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

    upButton(controller) {
        this._upButton = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.upButton);
    }

    downButton(controller) {
        this._downButton = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.downButton)
    }

    leftButton(controller) {
        this._leftButton = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.leftButton)
    }

    rightButton(controller) {
        this._rightButton = controller;
        controller.bindEncoder(this.name, this.page, this.encoders.rightButton)
    }

    // Sets the first n rows to the array provided.
    topKnobRow(controllers) {
        var f = function(c, i){ this.setKnobTop(c,i);}.bind(this)
        controllers.forEach(f);
    }

    // sets the i'th controller for the top row knob.
    setKnobTop(controller, i) {
        // LOG("setKnobTop: " + i + " controler: " + controller)
        this._knobsTop[i] = controller
        controller.bindEncoder(this.name, this.page, this.encoders.knobsTop[i])
    }

    middleKnobRow(controllers) {
        var f = function(c, i){ this.setKnobMiddle(c,i);}.bind(this)
        controllers.forEach(f);
    }

    setKnobMiddle(controller, i) {
        // LOG("setKnobMiddle: " + i + " controler: " + controller)
        this._knobsMiddle[i] = controller
        controller.bindEncoder(this.name, this.page, this.encoders.knobsMiddle[i])
    }

    // Sets the top left 8 knobs (top 0-3 and middle 0-3)
    topLeftKnobBank(controllers) {
        var f = function(c, i)
        { 
            if(i < 4){
                this.setKnobTop(c,i);
            }
            else{
                this.setKnobMiddle(c,i-4);
            }
        }.bind(this)
        controllers.forEach(f);
    }

    // Sets the top right 8 knobs (top 4-7 and middle 4-7)
    topRightKnobBank(controllers) {
        // LOG("topRightKnobBank count=" + controllers.length)
        var f = function(c, i)
        { 
            if(i < 4){
                // LOG("topRightKnobBank-A " + (i+4))
                this.setKnobTop(c, i + 4);
            }
            else{
                // LOG("topRightKnobBank-B " + i)
                this.setKnobMiddle(c,i );
            }
        }.bind(this)
        controllers.forEach(f);
    }

    lowerKnobRow(controllers) {
        var f = function(c, i){ this.setKnobBottom(c,i);}.bind(this)
        controllers.forEach(f);
    }

    // The right 4 bottom row knobs (to set the left ones, just use lowerKnobRow with only 4 controllers)
    lowerRightKnobs(controllers) {
        var f = function(c, i){ this.setKnobBottom(c,i+4);}.bind(this)
        controllers.forEach(f);
    }

    setKnobBottom(controller, i) {
        // LOG("setKnobBottom: " + i + " controler: " + controller)
        this._knobsBottom[i] = controller
        controller.bindEncoder(this.name, this.page, this.encoders.knobsBottom[i])
    }

    faders(controllers) {
        var f = function(c, i){ this.setFader(c,i);}.bind(this)
        controllers.forEach(f);
    }

    setFader(controller, i) {
        this._faders[i] = controller
        controller.bindEncoder(this.name, this.page, this.encoders.faders[i])
    }

    topButtonRow(controllers) {
        var f = function(c, i){ this.setButtonTop(c,i);}.bind(this)
        controllers.forEach(f);
    }

    setButtonTop(controller, i) {
        this._buttonsTop[i] = controller
        controller.bindEncoder(this.name, this.page, this.encoders.buttonsTop[i])
    }

    lowerButtonRow(controllers) {
        var f = function(c, i){ this.setButtonBottom(c,i);}.bind(this)
        controllers.forEach(f);
    }

    setButtonBottom(controller, i) {
        this._buttonsBottom[i] = controller
        controller.bindEncoder(this.name, this.page, this.encoders.buttonsBottom[i])
    }

    sideButtons(controllers) {
        var f = function(c, i){ this.setSideButton(c,i);}.bind(this)
        controllers.forEach(f);
    }

    setSideButton(controller, i) {
        this._sideButtons[i] = controller
        controller.bindEncoder(this.name, this.page, this.encoders.sideButtons[i])
    }

    // a whole collumn, 3 knobs, fader and 2 buttons
    columnFull(controllers, i)  {
        this.columnAboveButtomBotton(controllers, i)
        this.setButtonBottom(controllers[5], i);
    }

    // the whole column without the last button
    columnAboveButtomBotton(controllers, i)  {
        this.setKnobTop(controllers[0], i);
        this.setKnobMiddle(controllers[1], i);
        this.setKnobBottom(controllers[2], i);
        this.setFader(controllers[3], i);
        this.setButtonTop(controllers[4], i);
    }

    // the column including the bottom knob, the fader and the two buttons
    columnBelowBankOneButton(controllers, i)  {
        this.setKnobBottom(controllers[0], i);
        this.setFader(controllers[1], i);
        this.setButtonTop(controllers[2], i);
    }

    // a column with just the fader and two buttons.
    columnBelowKnobs(controllers, i)  {
        this.setFader(controllers[1], i);
        this.setButtonTop(controllers[2], i);
        this.setButtonBottom(controllers[3], i);
    }

    reset(activeDevice) {
        var init = function(controller){
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

        if( null != this._upButton) {
            // LOG("Reseting _upButton")
            this._upButton.reset(activeDevice)
        }
        if( null != this._downButton) {
            // LOG("Reseting _downButton")
            this._downButton.reset(activeDevice)
        }
        if( null != this._leftButton) {
            // LOG("Reseting _leftButton")
            this._leftButton.reset(activeDevice)
        }
        if( null != this._rightButton) {
            // LOG("Reseting _rightButton")
            this._rightButton.reset(activeDevice)
        }   
    }
}

// Sets the up down buttons to track next prev.
class LCXLPageTrack extends LCXLPage {
    constructor(name, deviceDriver, encoders) {
        super(name, deviceDriver, encoders);
        this.upButton(new LCXLController(Red).action(this.page.mHostAccess.mTrackSelection.mAction.mPrevTrack));
        this.downButton(new LCXLController(Red).action(this.page.mHostAccess.mTrackSelection.mAction.mNextTrack));

    }
}

//-----------------------------------------------------------------------------
// 6. Convenience functions
//-----------------------------------------------------------------------------

var trackQuickControls = function(colour, page){
    var quickControls = []
    for(var i = 0; i < 8; i++) {
        quickControls.push(new Variable(colour).value(page.mHostAccess.mTrackSelection.mMixerChannel.mQuickControls.getByIndex(i)))
    }
    return quickControls;
}

var trackQuickControlsGlide = function(page){
    var quickControls = []
    for(var i = 0; i < 8; i++) {
        quickControls.push(new Glide().value(page.mHostAccess.mTrackSelection.mMixerChannel.mQuickControls.getByIndex(i)))
    }
    return quickControls;
}

var focusedQuickControls = function(colour, page){
    var quickControls = []
    for(var i = 0; i < 8; i++) {  
        quickControls.push(new Variable(colour).value(page.mHostAccess.mFocusedQuickControls.getByIndex(i)))
    }
    return quickControls;
}

// para 1, low shel 1, high pass 1, high pass 2, para 2, low shelf 2, 3, 4
var eqColunns1 = function(page) { 
    return [new Options(Red.low, [Yellow.low, Orange.high, Green.low, Green.med, Yellow.high, Red.low, Red.med, Red.high])
                    .value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand1.mFilterType),
            new VariableScaled(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand1.mQ),
            new Variable(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand1.mFreq),
            new Glide().value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand1.mGain),
            new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand1.mOn)
    ];
}

// para 1, para 2
var eqColunns2 = function(page) { 
    return [   new Options(Yellow.high, [Yellow.low, Yellow.high]).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand2.mFilterType),
            new VariableScaled(Orange).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand2.mQ),
            new Variable(Orange).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand2.mFreq),
            new Glide().value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand2.mGain),
            new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand2.mOn)
        ];
}

// para 1, para 2
var eqColunns3 = function(page) { 
    return [   new Options(Yellow.high, [Yellow.low, Yellow.high]).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand3.mFilterType),
            new VariableScaled(Amber).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand3.mQ),
            new Variable(Amber).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand3.mFreq),
            new Glide().value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand3.mGain),
            new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand3.mOn)
    ];
}

// para 1, high shel 1, low pass 1, low pass 2, para 2, high shelf 2, 3, 4
var eqColunns4 = function(page) { 
    return [ new Options(Green.low, [Yellow.low, Lime.low, Red.low, Red.med, Yellow.high, Green.low, Green.med, Green.high])
                .value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand4.mFilterType),
            new VariableScaled(Green).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand4.mQ),
            new Variable(Green).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand4.mFreq),
            new Glide().value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand4.mGain),
            new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mChannelEQ.mBand4.mOn)
    ];
}

var trackButtonValues = function(page) {
    // On these buttons if used on the side buttons red is off BC there is no
    // green LED on the side buttons.
    return [
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMonitorEnable),
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mMute),
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mSolo),
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mRecordEnable)
    ];
}

// The regular value for selected track do not work on midi tracks
// But these command options do. However, there is no direct feedback, so the 
// LEDs will not change.
var trackButtonCommands = function(page) {
    return [
        new Toggle(Orange).command('Edit', 'Monitor'),
        new Toggle(Orange).command('Edit', 'Mute'),
        new Toggle(Orange).command('Edit', 'Solo'),
        new Toggle(Orange).command('Edit', 'Record Enable')
    ];
}

var sendsColumn = function(page, i) {
    var send = page.mHostAccess.mTrackSelection.mMixerChannel.mSends.getByIndex(i);
  
    var prepost = new Switch(Lime.high, Orange.high).value(send.mPrePost);
    var level = new Glide().value(send.mLevel);
    var on = new ToggleActivator(Orange, prepost).value(send.mOn);
    
    return [prepost, level, on];
}

var trackColumn = function(page) {
    return [
        new VariableScaled(Amber).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mPan),
        new Glide().value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mVolume),
        new Toggle(Red).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mAutomationWrite),
        new Toggle(Lime).value(page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen)];
}

var preFilterHigh = function(colour, surface, page) {
    return new VariableSwitch(colour, 
                new Commander("preFilterHigh")
                    .addTriggerValue(surface, page, page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mHighCutOn), 
                "20000Hz")
        .value(page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mHighCutFreq)
}

var preFilterLow = function(colour, surface, page) {
    return new VariableSwitch(colour, 
                new Commander("preFilterLow")
                    .addTriggerValue(surface, page,  page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mLowCutOn), 
                "20.0Hz")
        .value(page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mLowCutFreq)
}

var preFilterLowSlope = function(page, low) {
    return new OptionsManipulator(Amber, 
        [Red,Orange,Amber,Yellow,Green], 
        ["6 dB/Oct", "12 dB/Oct", "24 dB/Oct", "36 dB/Oct", "48 dB/Oct"],
        low)
        .value(page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mLowCutSlope);
}

var preFilterHighSlope = function(page, high) {
    return new OptionsManipulator(Amber, 
        [Red,Orange,Amber,Yellow,Green], 
        ["6 dB/Oct", "12 dB/Oct", "24 dB/Oct", "36 dB/Oct", "48 dB/Oct"],
        high)
        .value(page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mHighCutSlope);
}

var metronomeSwitch = function(colour, surface, page) {
    return new VariableSwitch(colour, 
                new Commander("metronomeActive")
                    .addTriggerValue(surface, page, page.mHostAccess.mTransport.mValue.mMetronomeActive), 
                "0", "pickup")
        .value(page.mHostAccess.mTransport.mValue.mMetronomeClickLevel)
}

var transport = function(page){
    return [
        new Trigger(Amber).command('Transport', 'To Left Locator'),
        new Trigger(Lime).command('Transport', 'To Right Locator'),
        new Trigger(Orange).value(page.mHostAccess.mTransport.mValue.mRewind),
        new Trigger(Lime).value(page.mHostAccess.mTransport.mValue.mForward),
        new Toggle(Orange).value(page.mHostAccess.mTransport.mValue.mCycleActive),
        new Toggle(Green).value(page.mHostAccess.mTransport.mValue.mStart),
        new Toggle(Red).value(page.mHostAccess.mTransport.mValue.mRecord)
    ];
}

var nudgeButtons = function() {
    return [
        new Trigger(Yellow).command('Nudge', 'Start Left' ),
        new Trigger(Lime).command( 'Nudge', 'Start Right' ),
        new Trigger(Amber).command( 'Nudge', 'Left'),
        new Trigger(Lime).command( 'Nudge', 'Right'),
        new Trigger(Orange).command( 'Nudge', 'End Left' ),
        new Trigger(Lime).command( 'Nudge', 'End Right'),
        new Trigger(Orange).command( 'Nudge', 'Loop Range Left'),
        new Trigger(Green).command( 'Nudge', 'Loop Range Right'),
    ];
}

var setTransportEditTrackButtons = function(lcxlPage){
    lcxlPage.lowerButtonRow(transport(lcxlPage.page));
    lcxlPage.setButtonBottom(new Toggle(Lime).value(lcxlPage.page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mEditorOpen),7);
    lcxlPage.sideButtons(trackButtonValues(lcxlPage.page));
}

var setTransportEditTrackButtonsInstrument = function(lcxlPage){
    lcxlPage.lowerButtonRow(transport(lcxlPage.page));
    lcxlPage.setButtonBottom(new Toggle(Lime).value(lcxlPage.page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mInstrumentOpen),7);
    lcxlPage.sideButtons(trackButtonCommands(lcxlPage.page));
}

var zoomKnob = function(colour, surface, page) {
    var zoom = new OptionsTrigger(colour, 
        new Commander("zoomOut").
        addTriggerCommand(surface, page, 'Zoom', 'Zoom Out').
        addTriggerCommand(surface, page, 'Zoom', 'Zoom Out Vertically'),
        new Commander("zoomIn").
            addTriggerCommand(surface, page, 'Zoom', 'Zoom In').
            addTriggerCommand(surface, page, 'Zoom', 'Zoom In Vertically'),     
        32);
    return zoom;
}

//-----------------------------------------------------------------------------
// 7. Launch Control Setup
//-----------------------------------------------------------------------------

var launchControlXL = new LaunchControlXL(deviceDriver, expectedName);
var lcxlEncoders = launchControlXL.makeEncoders(deviceDriver.mSurface);
//var lcxlEncoders2 = launchControlXL.makeEncoders(deviceDriver.mSurface);

// Iniitalize
//-----------------------------------------------------------------------------

deviceDriver.mOnActivate = function (activeDevice) {
    launchControlXL.initialize(activeDevice)
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

var mixerBankZone = PageMixer.page.mHostAccess.mMixConsole.makeMixerBankZone("Mixer")

PageMixer.upButton( new LCXLController(Red).action(mixerBankZone.mAction.mPrevBank));
PageMixer.downButton( new LCXLController(Red).action(mixerBankZone.mAction.mNextBank));

var mixerChannels = [];
for(var i = 0; i < 8; i++) {
    mixerChannels.push(mixerBankZone.makeMixerBankChannel());
}

var mixerSelected = [];
for(var i = 0; i < 8; i++) {
    mixerSelected.push(new Toggle(Inactive).value(mixerChannels[i].mValue.mSelected));
}
PageMixer.topButtonRow(mixerSelected);

var mixerVolume = [];
for(var i = 0; i < 8; i++) {
    mixerVolume.push(new Glide().value(mixerChannels[i].mValue.mVolume));
}
PageMixer.faders(mixerVolume);

var mixerPan = [];
for(var i = 0; i < 8; i++) {
    mixerPan.push(new Variable(Amber).value(mixerChannels[i].mValue.mPan));
}
PageMixer.lowerKnobRow(mixerPan);

var mixerFirstSend = [];
for(var i = 0; i < 8; i++) {
    mixerFirstSend.push(new Variable(Yellow).value(mixerChannels[i].mSends.getByIndex(0).mLevel));
}
PageMixer.middleKnobRow(mixerFirstSend);

var mixerCue = [];
for(var i = 0; i < 8; i++) {
    mixerCue.push(new Variable(Green).value(mixerChannels[i].mCueSends.getByIndex(0).mLevel));
}
PageMixer.topKnobRow(mixerCue);

PageMixer.sideButtons(trackButtonValues(PageMixer.page));
PageMixer.lowerButtonRow(transport(PageMixer.page));
PageMixer.setButtonBottom(new Toggle(Red).value(PageMixer.page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mAutomationWrite),7);


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
    pfl,pfh, 
    new VariableScaled(Red).value(PageTrack.page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mGain)
    ]);
PageTrack.setFader(preFilterLowSlope(PageTrack.page, pfl), 4);
PageTrack.setFader(preFilterHighSlope(PageTrack.page, pfh), 5);

PageTrack.setButtonTop(new InvertedToggle(Orange).value(PageTrack.page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mBypass), 4)
PageTrack.setButtonTop(new Toggle(Orange).value(PageTrack.page.mHostAccess.mTrackSelection.mMixerChannel.mPreFilter.mPhaseSwitch), 5);

// metronome
PageTrack.setFader(metronomeSwitch(Lime, deviceDriver.mSurface, PageTrack.page), 6);

// instrument open
PageTrack.setButtonTop(new Toggle(Lime).value(PageTrack.page.mHostAccess.mTrackSelection.mMixerChannel.mValue.mInstrumentOpen),6);

// pan valume write channelStrip open
PageTrack.columnBelowBankOneButton(trackColumn(PageTrack.page),7);

setTransportEditTrackButtons(PageTrack);

// Sends
// -----------------------------------------------------------------------------

var PageSends = new LCXLPageTrack("Sends", deviceDriver, lcxlEncoders);

// Track Controls
PageSends.topLeftKnobBank(trackQuickControls(Green, PageSends.page));

// Focus Controls
PageSends.topRightKnobBank(focusedQuickControls(Red, PageSends.page));

// Sends
for( var i = 0; i < 8; i++) {
    PageSends.columnBelowBankOneButton( sendsColumn(PageSends.page, i), i);
}

setTransportEditTrackButtons(PageSends);


// Instrument
// -----------------------------------------------------------------------------

var PageInstrument = new LCXLPageTrack("Instrument", deviceDriver, lcxlEncoders);

// Top two rows of knobs (except for the last two) are assignable in the GUI.
for( var i = 0; i < 6; i++) {
    PageInstrument.setKnobTop( new Variable(Orange), i);
    PageInstrument.setKnobMiddle( new Variable(Orange), i);

}

PageInstrument.setKnobTop(zoomKnob(Lime, deviceDriver.mSurface, PageInstrument.page),6)
PageInstrument.setKnobMiddle(new Switch(Red.high, Red.off).value(PageInstrument.page.mHostAccess.mFocusedQuickControls.mFocusLockedValue ),6)

// smart control
PageInstrument.setKnobTop(new VariableScaled(Green).value(PageInstrument.page.mHostAccess.mMouseCursor.mValueUnderMouse ),7)
PageInstrument.setKnobMiddle(new Switch(Green.off, Green.med).value(PageInstrument.page.mHostAccess.mMouseCursor.mValueLocked ),7)

// QCs
PageInstrument.lowerKnobRow(focusedQuickControls(Red, PageInstrument.page));
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
var cueTrackColumn = function(surface, page, index) {
    var cueChannel = page.mHostAccess.mControlRoom.getCueChannelByIndex(index);
    var cueChannelTalkback =  new VariableSwitch(Yellow, 
        new Commander("cue" + index + "Talkback").addTriggerValue(surface, page, cueChannel.mTalkbackEnabledValue), 
        "0", "pickup").value(cueChannel.mTalkbackLevelValue);

    var cueSend = page.mHostAccess.mTrackSelection.mMixerChannel.mCueSends.getByIndex(index);
    var cueTrackPrepost = new Switch(Lime.high, Orange.high).value(cueSend.mPrePost);
    var cueTrackPan = new Variable(Amber).value(cueSend.mPan);
    var cueTrackLevel = new Glide().value(cueSend.mLevel);
    var cueTrackOn = new Toggle(Lime).value(cueSend.mOn);
    
    return [cueChannelTalkback, cueTrackPrepost, cueTrackPan, cueTrackLevel, cueTrackOn];
}

// Control one of 4 cue channels.  
var cueChannelColumn = function(surface, page, index) {
    var cueChannel = page.mHostAccess.mControlRoom.getCueChannelByIndex(index);
    var cusChannelBypassInserts = new Switch(Lime.high, Orange.high).value(cueChannel.mBypassInserts)
    var cusChannelClickPan = new Variable(Amber).value(cueChannel.mMetronomeClickPanValue);
    var cusChanneClickSwitch = new VariableSwitch(Green, 
        new Commander("cue" + index + "Metronome").addTriggerValue(surface, page, cueChannel.mMetronomeClickActiveValue), 
            "0", "pickup").value(cueChannel.mMetronomeClickLevelValue);
    var cusChannelLevel  = new Glide().value(cueChannel.mLevelValue);
    var cusChannelMute =  new Toggle(Green).value(cueChannel.mMuteValue);
    return [cusChannelBypassInserts, cusChannelClickPan, cusChanneClickSwitch, cusChannelLevel, cusChannelMute]
}

var PageCue = new LCXLPageTrack("Cue", deviceDriver, lcxlEncoders);

for( var i = 0; i < 4; i++) {
    PageCue.columnAboveButtomBotton( cueChannelColumn(deviceDriver.mSurface, PageCue.page, i), i);
}

for( var i = 4; i < 8; i++) {
    PageCue.columnAboveButtomBotton( cueTrackColumn(deviceDriver.mSurface, PageCue.page, i-4), i);
}

setTransportEditTrackButtons(PageCue);