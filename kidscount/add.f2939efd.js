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
})({"RNG.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RNG = void 0;
var RNG = /** @class */function () {
  function RNG(seed) {
    // faster than added uniform 
    this.haveNextNextGaussian = false;
    this.nextNextGaussian = 0;
    if (seed) this.seed = seed;else this.seed = Math.random() * 9999999999;
  }
  RNG.prototype.next = function (min, max) {
    max = max || 0;
    min = min || 0;
    this.seed = (this.seed * 9301 + 49297) % 233280;
    var rnd = this.seed / 233280; //233279
    return min + rnd * (max - min);
  };
  // http://indiegamr.com/generate-repeatable-random-numbers-in-js/
  RNG.prototype.nextInt = function (min, max) {
    return Math.floor(this.next(min, max));
  };
  RNG.prototype.nextDouble = function () {
    return this.next(0, 1);
  };
  RNG.prototype.range = function (a, b) {
    return this.next(a, b);
  };
  RNG.prototype.rangeD = function (a, b) {
    return a + this.nextDouble() * (b - a);
  };
  RNG.prototype.chance = function (ch) {
    return this.nextDouble() < ch;
  };
  RNG.prototype.pick = function (collection) {
    return collection[this.nextInt(0, collection.length)];
  };
  RNG.prototype.pickW = function (collection, wts) {
    if (collection.length != wts.length) return undefined;
    var s = 0;
    for (var _i = 0, wts_1 = wts; _i < wts_1.length; _i++) {
      var w = wts_1[_i];
      s += w;
    }
    var ch = this.nextDouble() * s;
    for (var i = 0; i < collection.length; i++) {
      if (ch < wts[i]) return collection[i];
      ch -= wts[i];
    }
    return undefined;
  };
  RNG.prototype.shuffle = function (arr) {
    var _a;
    for (var i = 0; i < arr.length; i++) {
      var j = this.nextInt(0, arr.length);
      _a = [arr[j], arr[i]], arr[i] = _a[0], arr[j] = _a[1];
    }
  };
  RNG.prototype.nextGaussian = function () {
    // See Knuth, ACP, Section 3.4.1 Algorithm C.
    if (this.haveNextNextGaussian) {
      this.haveNextNextGaussian = false;
      return this.nextNextGaussian;
    } else {
      var v1, v2, s;
      do {
        v1 = 2 * this.nextDouble() - 1; // between -1 and 1
        v2 = 2 * this.nextDouble() - 1; // between -1 and 1
        s = v1 * v1 + v2 * v2;
      } while (s >= 1 || s == 0);
      var multiplier = Math.sqrt(-2 * Math.log(s) / s);
      this.nextNextGaussian = v2 * multiplier;
      this.haveNextNextGaussian = true;
      return v1 * multiplier;
    }
  };
  return RNG;
}();
exports.RNG = RNG;
},{}],"add.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var RNG_1 = require("./RNG");
var rand = new RNG_1.RNG();
var ANIMALS = {
  "cows": "cow",
  "doggos": "dog",
  "chickens": "chicken",
  "elephants": "elephant",
  "pandas": "panda",
  "rhinos": "rhino",
  "piggies": "pig",
  "monkeys": "monkey",
  "giraffes": "giraffe",
  "bears": "bear",
  "moose": "moose",
  "buffaloes": "buffalo",
  "rabbits": "rabbit",
  "sloths": "sloth"
};
function addAnimal(animal) {
  var _a;
  var d1 = document.createElement("div");
  d1.classList.add("float", "box");
  var top = rand.nextInt(100, 400);
  d1.style.top = top + "px";
  d1.style.left = "100px";
  d1.style.width = "50%";
  var d2 = document.createElement("div");
  d2.classList.add("roaming", "box");
  var delay = rand.nextInt(0, 120) / 4;
  d2.style["animation-delay"] = -delay + "s";
  var dur = rand.nextInt(30, 50);
  d2.style["animation-duration"] = dur + "s";
  d1.appendChild(d2);
  var img = document.createElement("img");
  img.src = "./animals/".concat(animal, ".png");
  // img.classList.add("dancing")
  img.onload = function () {
    console.log(img.width, img.height);
    // img.width = img.width*64/img.height;
    img.height = 64;
  };
  // img.style["margin-left"] = "100px"
  d2.appendChild(img);
  (_a = document.getElementsByTagName("body").item(0)) === null || _a === void 0 ? void 0 : _a.appendChild(d1);
}
function cleanup() {
  // console.log("***********")
  var imgs = document.getElementsByClassName("float");
  var imgs2 = [];
  for (var _i = 0, imgs_1 = imgs; _i < imgs_1.length; _i++) {
    var img = imgs_1[_i];
    imgs2.push(img);
  }
  for (var _a = 0, imgs2_1 = imgs2; _a < imgs2_1.length; _a++) {
    var img = imgs2_1[_a];
    img.remove();
  }
  var main = document.getElementById("main");
  while (main && main.firstChild) main.firstChild.remove();
}
function newGame() {
  cleanup();
  var count = rand.nextInt(1, 5);
  var all_animals = Object.keys(ANIMALS);
  var this_anim = rand.pick(all_animals);
  for (var i = 0; i < count; i++) addAnimal(ANIMALS[this_anim]);
  var main = document.getElementById("main");
  if (!main) throw "no main";
  var txt = document.createElement("div");
  txt.textContent = "How many ".concat(this_anim, "?");
  txt.classList.add("message");
  main.append(txt);
  var inp = document.createElement("input");
  inp.type = "number";
  inp.classList.add("inp");
  main.append(inp);
  var go = document.createElement("button");
  go.textContent = "Go";
  go.classList.add("go");
  main.append(go);
  var yes = document.createElement("div");
  yes.textContent = "Correct!";
  yes.style.display = "none";
  yes.classList.add("suc");
  main.append(yes);
  var no = document.createElement("div");
  no.textContent = "Try again!";
  no.style.display = "none";
  no.classList.add("fail");
  main.append(no);
  go.onclick = function (ev) {
    if (inp.value == "" + count) {
      setTimeout(function () {
        newGame();
      }, 2000);
      {
        var imgs = document.getElementsByClassName("roaming");
        for (var _i = 0, imgs_2 = imgs; _i < imgs_2.length; _i++) {
          var img = imgs_2[_i];
          img.style.animationPlayState = "paused";
        }
      }
      {
        var imgs = document.getElementsByTagName("img");
        for (var _a = 0, imgs_3 = imgs; _a < imgs_3.length; _a++) {
          var img = imgs_3[_a];
          img.classList.add("dancing");
        }
      }
      no.style.display = "none";
      yes.style.display = "";
    } else {
      yes.style.display = "none";
      no.style.display = "";
    }
  };
}
newGame();
},{"./RNG":"RNG.ts"}]},{},["add.ts"], null)
//# sourceMappingURL=add.f2939efd.js.map