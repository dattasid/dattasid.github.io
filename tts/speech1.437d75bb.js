// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"util.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mkAppend = void 0;
function mkAppend(parent, id, type, attrs) {
  if (type === void 0) {
    type = "div";
  }
  if (attrs === void 0) {
    attrs = {};
  }
  var d = document.createElement(type);
  if (id) d.id = id;
  if (attrs) {
    for (var _i = 0, _a = Object.keys(attrs); _i < _a.length; _i++) {
      var attrn = _a[_i];
      d[attrn] = attrs[attrn];
    }
  }
  parent.appendChild(d);
  return d;
}
exports.mkAppend = mkAppend;
},{}],"speech1.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var util_1 = require("./util");
var speechAPI = window.speechSynthesis;
var LOG = console.log;
var WORK = undefined;
var playPause;
function makeUI() {
  var main = document.getElementById("main");
  var topbar = (0, util_1.mkAppend)(main, "topbar");
  var btn = (0, util_1.mkAppend)(topbar, "btn", "button", {
    textContent: "Speak"
  });
  var b_reset = (0, util_1.mkAppend)(topbar, "brst", "button", {
    textContent: "Reset position"
  });
  b_reset.onclick = function () {
    WORK.reset();
  };
  var text_in = (0, util_1.mkAppend)(main, "text_in", "textarea", {
    rows: 25
  });
  text_in.onchange = function () {
    WORK = new TextArray(processText(text_in.value));
    speaking = false;
  };
  btn.onclick = function () {
    if (speaking) {
      speaking = false;
      btn.textContent = "Speak";
      speechAPI.cancel();
      if (WORK) WORK.prev();
      LOG("Stop speaking");
    } else {
      LOG("Start speaking");
      speaking = true;
      if (!WORK) {
        var text = text_in.value;
        WORK = new TextArray(processText(text));
      }
      startSpeaking();
      btn.textContent = "Stop Speaking";
    }
  };
  playPause = btn;
  window.onbeforeunload = function () {
    speechAPI.cancel();
    msg.text = "Closing!";
    speechAPI.speak(msg);
  };
}
makeUI();
var replacements = {
  '“': '"',
  '”': '"'
};
function removeNonAlphabeticalAndNonASCIIChars(input) {
  // This regex matches any character that is not:
  // - a letter in any alphabet (\p{L})
  // - a character intended to be combined with another character (\p{M})
  // - an ASCII character (from space (0x20) to tilde (0x7E))
  // The 'u' flag enables Unicode support
  // return input.replace(/[^\p{L}\p{M}\x20-\x7E]+/gu, '');
  input = input.replace(/[“”]/g, function (match) {
    return replacements[match];
  });
  return input.replace(/[\u2000-\u206F]/g, ''); //unicode punctuations
  // return input;
}

function processText(input) {
  var res = [];
  var lines = input.split(/\n/);
  for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
    var line = lines_1[_i];
    line = line + "^"; // Mark end of sentence.
    var parts = line.split(/(?<=\.)/);
    parts = parts.map(function (s) {
      return removeNonAlphabeticalAndNonASCIIChars(s);
    });
    // LOG(parts)
    res.push.apply(res, parts);
  }
  LOG(res);
  return res;
}
// processText()
var TextArray = /** @class */function () {
  function TextArray(parts) {
    this.parts = parts;
    this.idx = 0;
  }
  TextArray.prototype.reset = function () {
    this.idx = 0;
  };
  TextArray.prototype.prev = function () {
    if (this.idx > 0) this.idx--;
  };
  TextArray.prototype.next = function () {
    if (this.idx >= this.parts.length) return null;
    this.idx++;
    return this.parts[this.idx - 1];
  };
  return TextArray;
}();
// const WORK = new TextArray(processText(TEXT))
// Create a new instance of SpeechSynthesisUtterance
var msg = new SpeechSynthesisUtterance();
// Set the text you want to be spoken
msg.text = "Hello, how are you today?";
// Optionally, you can also customize the voice, pitch, and rate
// msg.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == 'Google UK English Male'; })[0];
// msg.pitch = 1; // Range between 0 and 2
// msg.rate = 1; // Range between 0.1 and 10
msg.rate = 1;
var voices;
var DEFAULT_VOICE_NAME = "Google UK English Male";
var DEFAULT_VOICE;
window.speechSynthesis.onvoiceschanged = function () {
  var _a;
  // console.log(window.speechSynthesis.getVoices())
  voices = window.speechSynthesis.getVoices();
  voices = voices.filter(function (v) {
    return v.name.indexOf("English") > -1;
  });
  console.log(voices.map(function (v) {
    return v.name;
  }));
  DEFAULT_VOICE = voices.find(function (v) {
    return v.name == DEFAULT_VOICE_NAME;
  });
  msg.voice = DEFAULT_VOICE;
  msg.rate = 1.2;
  console.log((_a = msg.voice) === null || _a === void 0 ? void 0 : _a.name);
};
msg.onerror = function (event) {
  console.log(event.error);
};
var firstTime = true;
var speaking = false;
function startSpeaking() {
  var _a;
  // LOG("--- speaking ", speaking)
  if (!speaking) return;
  // msg.rate = 1
  // // msg.rate = .1 + Math.random()<.5?.7:3;
  //   // msg.rate = Math.random()<.5?.9:1.1;
  //   msg.pitch = Math.random()<.5?.5:2;
  //   msg.volume = Math.random()<.5?.9:1.1;
  // if (voices)
  // {
  //   msg.voice = voices[Math.floor(Math.random() * voices.length)]
  //   console.log(msg.voice?.name, msg.pitch, msg.rate, msg.volume)
  // }
  var text = WORK.next();
  if (!text) {
    speaking = false;
    WORK.reset();
    console.log("DONE SPEAKING");
    playPause.textContent = "Speak";
    return;
  }
  msg.rate = 1.2 * (Math.random() * .2 + .9);
  console.log((_a = msg.voice) === null || _a === void 0 ? void 0 : _a.name, msg.pitch, msg.rate, msg.volume);
  var lastch = text.charAt(text.length - 1);
  var timeout;
  switch (lastch) {
    case "^":
      // Special char, end of paragraph
      timeout = 200;
      text = text.slice(0, -1);
      text;
      break;
    case ".":
      timeout = 100;
      break;
    case ",":
      timeout = 30;
      break;
    default:
      timeout = 30;
      break;
  }
  msg.text = text;
  msg.onend = function (event) {
    setTimeout(startSpeaking, timeout); // 100ms delay
  };
  // Speak the text
  window.speechSynthesis.speak(msg);
  // window.speechSynthesis.speak(msg);
  if (firstTime) {
    // console.log(window.speechSynthesis.getVoices())
    firstTime = false;
  }
}
// Workaround if speech synthesis suddenly pauses
// let r = setInterval(() => {
//   console.log(speechSynthesis.speaking);
//   if (!speechSynthesis.speaking) {
//     clearInterval(r);
//   } else {
//     speechSynthesis.resume();
//   }
// }, 14000);
//-------------------------
//speech experiments
function makeUI_Expt() {
  var main = document.getElementById("main");
  var topbar = (0, util_1.mkAppend)(main, "topbar");
  var btn = (0, util_1.mkAppend)(topbar, "btn", "button", {
    textContent: "Speak"
  });
  var m_pitch = (0, util_1.mkAppend)(topbar, "m_pitch", "label", {
    textContent: "Pitch: "
  });
  var i_pitch = (0, util_1.mkAppend)(topbar, "i_pitch", "input", {
    type: "number",
    min: 0,
    max: 2,
    step: .05,
    value: 1
  });
  var m_rate = (0, util_1.mkAppend)(topbar, "m_rate", "label", {
    textContent: "Rate: "
  });
  var i_rate = (0, util_1.mkAppend)(topbar, "i_rate", "input", {
    type: "number",
    min: .1,
    max: 10,
    step: .1,
    value: 1
  });
  var s_voices = (0, util_1.mkAppend)(topbar, "s_voices", "select");
  var voices;
  window.speechSynthesis.onvoiceschanged = function () {
    // console.log(window.speechSynthesis.getVoices())
    voices = window.speechSynthesis.getVoices();
    // voices = voices.filter((v)=>(v.name as string).indexOf("English")>-1)
    // console.log(voices)
    for (var _i = 0, voices_1 = voices; _i < voices_1.length; _i++) {
      var v = voices_1[_i];
      var o = (0, util_1.mkAppend)(s_voices, null, "option", {
        textContent: v.name
      });
      // o.value = v.name
    }
  };

  var msg = new SpeechSynthesisUtterance();
  btn.onclick = function () {
    {
      LOG("Start speaking");
      speaking = true;
      msg.text = "This is a test. The quick brown fox jumps over the lazy dog.";
      msg.pitch = +i_pitch.value;
      msg.rate = +i_rate.value;
      msg.volume = 1;
      msg.voice = voices[s_voices.selectedIndex];
      speechAPI.speak(msg);
    }
  };
}
// makeUI_Expt()
},{"./util":"util.ts"}]},{},["speech1.ts"], null)
//# sourceMappingURL=speech1.437d75bb.js.map
