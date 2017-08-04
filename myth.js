define(["require", "exports", "./RNG", "./NameGen"], function (require, exports, RNG_1, NameGen_1) {
    "use strict";
    exports.__esModule = true;
    var C;
    (function (C) {
        C[C["NONE"] = 0] = "NONE";
        C[C["HOT"] = 1] = "HOT";
        C[C["TEMPERATE"] = 2] = "TEMPERATE";
        C[C["COLD"] = 3] = "COLD";
        C[C["SEA"] = 4] = "SEA";
        C[C["NO_SEA"] = 5] = "NO_SEA";
        C[C["FISHING"] = 6] = "FISHING";
        C[C["FARMING"] = 7] = "FARMING";
        C[C["ANIMALS"] = 8] = "ANIMALS";
        C[C["RICE"] = 9] = "RICE";
        C[C["WHEAT"] = 10] = "WHEAT";
        C[C["CORN"] = 11] = "CORN";
        C[C["MAIZE"] = 12] = "MAIZE";
        C[C["FISH"] = 13] = "FISH";
        C[C["COW"] = 14] = "COW";
        C[C["SHEEP"] = 15] = "SHEEP";
        // start empty
        C[C["VOID"] = 16] = "VOID";
        C[C["CHAOS"] = 17] = "CHAOS";
        C[C["WATER"] = 18] = "WATER";
        C[C["AIR"] = 19] = "AIR";
        C[C["BIRD"] = 20] = "BIRD";
        C[C["GIANT"] = 21] = "GIANT";
        C[C["SERPENT"] = 22] = "SERPENT";
        C[C["DRAGON"] = 23] = "DRAGON";
        C[C["SEED"] = 24] = "SEED";
        C[C["EGG"] = 25] = "EGG";
        C[C["SPHERE"] = 26] = "SPHERE";
        C[C["BALL"] = 27] = "BALL";
        // Egg states
        C[C["CLOSED"] = 28] = "CLOSED";
        C[C["OPEN"] = 29] = "OPEN";
        C[C["PRIMAL_GOD"] = 30] = "PRIMAL_GOD";
        C[C["MAJOR_GOD"] = 31] = "MAJOR_GOD";
        C[C["MINOR_GOD"] = 32] = "MINOR_GOD";
        C[C["OLD_GODS"] = 33] = "OLD_GODS";
        // entity states
        C[C["ACTIVE"] = 34] = "ACTIVE";
        C[C["DORMANT"] = 35] = "DORMANT";
        C[C["DEAD"] = 36] = "DEAD";
        C[C["HUMANS"] = 37] = "HUMANS";
        C[C["DWARVES"] = 38] = "DWARVES";
        C[C["ELVES"] = 39] = "ELVES";
        C[C["SMITH"] = 40] = "SMITH";
        C[C["TRICKSTER"] = 41] = "TRICKSTER";
        C[C["EARTH"] = 42] = "EARTH";
        C[C["SKY"] = 43] = "SKY";
        C[C["NORTH"] = 44] = "NORTH";
        C[C["SOUTH"] = 45] = "SOUTH";
        C[C["EAST"] = 46] = "EAST";
        C[C["WEST"] = 47] = "WEST";
        C[C["MALE"] = 48] = "MALE";
        C[C["FEMALE"] = 49] = "FEMALE";
        // Note: VIRGIN MOTHER CRONE archetype
        // Note: FATHER SON KING JUDGE SAVIOR SAGE/SHAMAN TRICKSTER lord of destruction
    })(C || (C = {}));
    ;
    var animals = ["tiger", "lion", "jaguar", "horse", "zebra", "mouse", "frog", "snake",
        "salamander", "rooster", "crane", "heron", "swan", "crocodile", "bear", "phoenix", "gryphon"];
    function cstr(c) {
        return C[c].toLowerCase().replace("_", " ");
    }
    function cap1(s) {
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    }
    function anded(arr) {
        var l = arr.length;
        if (l == 0)
            return "";
        else if (l == 1)
            return "" + arr[0].toString();
        else {
            var s_1 = "" + arr[0];
            for (var i = 1; i < l - 1; i++) {
                s_1 += ", " + arr[i];
            }
            s_1 += " and " + arr[l - 1];
            return s_1;
        }
    }
    function remelem(arr, key) {
        var index = arr.indexOf(key, 0);
        if (index > -1) {
            arr.splice(index, 1);
        }
    }
    var Pick = (function () {
        function Pick(elem, stateChanges) {
            if (stateChanges === void 0) { stateChanges = undefined; }
            this.elem = elem;
            this.stateChanges = stateChanges;
        }
        return Pick;
    }());
    var Picker = (function () {
        function Picker(rand) {
            this.rand = rand;
            this.elems = [];
            this.wts = [];
        }
        Picker.prototype.choice = function (item, wt, condition, stateChanges) {
            if (wt === void 0) { wt = 1; }
            if (condition === void 0) { condition = true; }
            if (stateChanges === void 0) { stateChanges = undefined; }
            if (!condition || typeof condition === 'undefined')
                return this;
            if (wt < 0)
                wt = 0;
            if (item instanceof Array) {
                for (var _i = 0, item_1 = item; _i < item_1.length; _i++) {
                    var ii = item_1[_i];
                    this.elems.push(new Pick(ii, stateChanges));
                    this.wts.push(wt);
                }
            }
            else {
                this.elems.push(new Pick(item, stateChanges));
                this.wts.push(wt);
            }
            return this;
        };
        Picker.prototype.pick = function () {
            var ret = "";
            if (this.elems.length == 0)
                return null;
            var pick = this.rand.pickW(this.elems, this.wts);
            if (pick.stateChanges) {
                for (var _i = 0, _a = pick.stateChanges; _i < _a.length; _i++) {
                    var sc = _a[_i];
                    if (sc) {
                        var s;
                        s = sc();
                        if (s)
                            ret += s;
                    }
                }
            }
            if (ret.length == 0)
                return resolve(pick.elem);
            return ret + resolve(pick.elem);
        };
        Picker.prototype.numChoices = function () {
            return this.elems.length;
        };
        return Picker;
    }());
    ;
    function beginPick(rand) {
        return new Picker(rand);
    }
    function resolve(v) {
        while (typeof v === 'function')
            v = v();
        return v;
    }
    var Entity = (function () {
        // End group attributes
        function Entity(name) {
            this.name = name;
            this.etype = C.MAJOR_GOD; // Egg, primal or major god.
            this.type = C.NONE;
            this.aspect = C.NONE;
            this.gender = C.NONE;
            this.evil = false;
            this.spouse = null;
            this.group = null;
            // Begin group attributes
            this.grpCount = 0; // Count if group
            this.members = []; // members if group
        }
        Entity.prototype.toString = function () {
            return "[" + this.name + "]";
        };
        return Entity;
    }());
    var MythState = (function () {
        function MythState() {
            var _this = this;
            this.rand = new RNG_1.RNG(Math.random() * 99999999);
            this.firstGod = null;
            this.cosmicEgg = null;
            this.worldTree = null;
            this.flooded = false;
            this.sun = false; // TODO: Entity
            this.moon = false; // TODO: Entity
            this.plants = false;
            this.animals = false;
            this.races = [];
            this.gods = [];
            this.earth_god = null;
            this.sky_god = null;
            this.groups = [];
            this.flags = {};
            this.wars = 0;
            this.out = "";
            this.namegen = this.rand.pick([
                new NameGen_1.NameGen(["s", "ss", "ss", "sV", "ssV"], this.rand),
                new NameGen_1.NameGen(["s's", "s'sV"], this.rand)
            ]);
            var ngNull = new NameGen_1.NameGen([""], this.rand);
            this.ng_m_pre = this.ng_f_pre =
                this.ng_m_suf = this.ng_f_suf = ngNull;
            var p = new Picker(this.rand);
            p.choice([
                function () {
                    _this.ng_f_suf = new NameGen_1.NameGen(["v", "V"], _this.rand);
                    _this.name_grp_suf = new NameGen_1.NameGen(["s", "V"], _this.rand).generate();
                    _this.ng_grp_pre = new NameGen_1.NameGen(["s"], _this.rand);
                },
                function () {
                    _this.namegen = new NameGen_1.NameGen(["s" /*, "ss", "sV"*/], _this.rand);
                    _this.ng_f_pre = new NameGen_1.NameGen(["V'"], _this.rand);
                    _this.ng_m_pre = new NameGen_1.NameGen(["Bv'", "BV'"], _this.rand);
                    _this.name_grp_suf = "'" + new NameGen_1.NameGen(["s", "V"], _this.rand).generate();
                    _this.ng_grp_pre = new NameGen_1.NameGen(["s"], _this.rand);
                },
                function () {
                    _this.namegen = new NameGen_1.NameGen(["s" /*, "ss", "ss", "sV", "ssV"*/], _this.rand);
                    _this.ng_f_suf = new NameGen_1.NameGen(["'vs"], _this.rand);
                    _this.ng_m_suf = new NameGen_1.NameGen(["'sV", "'sv"], _this.rand);
                    _this.name_grp_suf = "'" + new NameGen_1.NameGen(["s", "V"], _this.rand).generate();
                    _this.ng_grp_pre = new NameGen_1.NameGen(["s"], _this.rand);
                },
                function () {
                    _this.namegen = new NameGen_1.NameGen(["s"], _this.rand);
                    _this.ng_m_suf = new NameGen_1.NameGen(["s"], _this.rand);
                    _this.ng_f_suf = new NameGen_1.NameGen(["sv", "sV"], _this.rand);
                    _this.name_grp_suf = new NameGen_1.NameGen(["s", "V"], _this.rand).generate();
                    _this.ng_grp_pre = new NameGen_1.NameGen(["s"], _this.rand);
                },
            ]);
            p.pick();
        }
        MythState.prototype.append = function (s) {
            this.out += s;
        };
        MythState.prototype.line = function (line) {
            if (line == undefined)
                throw new Error(line);
            this.append(line + "\n");
        };
        MythState.prototype.nameGen = function () {
            return this.rand.pick(this.nameGenPair());
        };
        MythState.prototype.nameGenPair = function () {
            var s = this.namegen.generate();
            return [
                cap1(this.ng_m_pre.generate() + s + this.ng_m_suf.generate()),
                cap1(this.ng_f_pre.generate() + s + this.ng_f_suf.generate())
            ];
        };
        MythState.prototype.nameGenM = function () {
            var s = this.namegen.generate();
            return cap1(this.ng_m_pre.generate() + s + this.ng_m_suf.generate());
        };
        MythState.prototype.nameGenF = function () {
            var s = this.namegen.generate();
            return cap1(this.ng_f_pre.generate() + s + this.ng_f_suf.generate());
        };
        MythState.prototype.getFreeGod = function () {
            var a = [].concat(this.gods);
            if (this.firstGod != null && this.firstGod.state != C.DORMANT)
                a.push(this.firstGod);
            for (var _i = 0, _a = this.groups; _i < _a.length; _i++) {
                var gg = _a[_i];
                Array.prototype.push.apply(a, gg.members);
            }
            // TODO earth sky
            if (a.length == 0)
                return null;
            return this.rand.pick(a);
        };
        return MythState;
    }());
    function makeFirstGod(state) {
        var rand = state.rand;
        var firstGodType = new Picker(state.rand)
            .choice(C.NONE, 2)
            .choice(C.BIRD, 1, state.fromChaosStart != C.WATER)
            .choice(C.FISH, 1, state.fromChaosStart == C.WATER)
            .choice([C.SERPENT, C.DRAGON])
            .pick();
        var firstGodName = state.nameGen();
        if (state.rand.nextDouble() > .3 && firstGodType != C.NONE) {
            firstGodName += " the " + rand.pick(["Ancient ", "Primordial ", "Great ", "Giant ", ""]) + cap1(cstr(firstGodType));
        }
        state.firstGod = new Entity(firstGodName);
        state.firstGod.type = firstGodType;
        var OPENEGG = function () { state.cosmicEgg.state = C.OPEN; };
        var p = new Picker(state.rand);
        p.choice([
            "Then " + state.firstGod + " came into being.",
        ]);
        if (!state.cosmicEgg) {
            p.choice([
                state.firstGod + " wandered in the " + cstr(state.fromChaosStart) + " endlessly.",
                state.firstGod + " floated in the " + cstr(state.fromChaosStart) + ", dormant. Finally " + state.firstGod + " awoke!",
                state.firstGod + " floated in the " + cstr(state.fromChaosStart) + ", meditating. Finally " + state.firstGod + " spoke the first word, and came into existance!",
            ])
                .choice(state.firstGod + " shaped himself out of the " + cstr(state.fromChaosStart) + ".", 1, state.firstGod.type == C.NONE, [function () { state.firstGod.aspect = C.SMITH; }]);
        }
        if (state.cosmicEgg) {
            p.choice([
                state.firstGod + " held " + state.cosmicEgg + " in a loving embrace.",
                state.firstGod + " kept a watchful vigil on " + state.cosmicEgg + ".",
                state.firstGod + " stalked " + state.cosmicEgg + ", trying to destroy it."
            ])
                .choice(state.cosmicEgg + " cracked open, and " + state.firstGod + " emerged.", 2, state.cosmicEgg.type != C.SEED, [OPENEGG])
                .choice(state.cosmicEgg + " sprouted and grew, and " + state.firstGod + " was born from it.", 2, state.cosmicEgg.type == C.SEED, [OPENEGG]);
        }
        var ret = p.pick();
        if (typeof ret === 'function')
            ret = ret();
        state.line(ret);
    }
    function makeCosmicEgg(state) {
        var rand = state.rand;
        var cosmicEggType = new Picker(state.rand)
            .choice([C.SEED, C.EGG, C.SPHERE,])
            .pick();
        var cosmicEggName = "Cosmic " + cap1(cstr(cosmicEggType));
        state.cosmicEgg = new Entity(cosmicEggName);
        state.cosmicEgg.type = cosmicEggType;
        state.cosmicEgg.state = C.CLOSED;
        var p = new Picker(rand);
        p.choice("Then the " + state.cosmicEgg + " came into being.");
        if (state.firstGod) {
            p
                .choice(state.firstGod + " laid the " + state.cosmicEgg + ".", 1, (state.firstGod.type == C.BIRD || state.firstGod.type == C.FISH)
                && cosmicEggType == C.EGG)
                .choice(state.firstGod + " created the " + state.cosmicEgg + "."), 1 + (state.firstGod.aspect == C.SMITH ? 2 : 0);
        }
        var ret = p.pick();
        if (typeof ret === 'function')
            ret = ret();
        state.line(ret);
    }
    function createWorldTree(state) {
        var nm = state.nameGen() + " the " + state.rand.pick(["Viridian ", "Verdant ", "Emerald ", "Blazing ", "Glorious ", "Jade ", "", "", "", ""]) + "Worldtree";
        state.worldTree = new Entity(nm);
    }
    function makeEarthSky(state) {
        // TODO bird can do with beak or wings, fish with tail
        var rand = state.rand;
        var p = new Picker(rand);
        var fromtree = false;
        var FLOOD = function () { state.flooded = true; };
        var DRYLAND = function () { state.flooded = false; };
        var MAKETREE = function () { createWorldTree(state); fromtree = true; };
        if (state.cosmicEgg) {
            if (state.cosmicEgg.state == C.OPEN) {
                // TODO if (firstGod)
                if (state.firstGod != null) {
                    p
                        .choice(state.firstGod + " created the sky and the earth from the shells of " + state.cosmicEgg + ".", 1, state.cosmicEgg.type == C.EGG, [DRYLAND])
                        .choice(state.firstGod + " created the sky and the earth from the remnant fragments of " + state.cosmicEgg + ".", 1, state.cosmicEgg.type != C.SEED, [DRYLAND])
                        .choice(state.firstGod + " created the sky and the earth from the husk of " + state.cosmicEgg + ".", 1, state.cosmicEgg.type == C.SEED, [DRYLAND]);
                }
            }
            else {
                // Open cosmicegg if these options are chosen
                var OPENEGG = function () { state.cosmicEgg.state = C.OPEN; };
                p
                    .choice([
                    state.firstGod + " struck the " + state.cosmicEgg + ", and the " + state.cosmicEgg + " rang and cracked, and gave birth to the sky and the earth.",
                    state.firstGod + " sang, and the " + state.cosmicEgg + " vibrated and reverberated and finally " + rand.pick(["cracked open", "opened", "dissolved"]) + ", and gave birth to the sky and the earth."
                ], 1, state.firstGod && state.cosmicEgg.type != C.SEED, [OPENEGG, DRYLAND])
                    .choice([
                    state.cosmicEgg + " " + rand.pick(["cracked open", "opened", "dissolved"]) + ", and gave birth to the sky and the earth.",
                ], 1, state.cosmicEgg.type != C.SEED, [OPENEGG, DRYLAND])
                    .choice(function () {
                    return state.firstGod + " " + rand.pick(["sang to", "spoke to", "whispered to"]) + " the " + state.cosmicEgg + ", and " + state.cosmicEgg + " sprouted and grew into " + state.worldTree + ". Its canopy became the sky and its roots the earth.";
                }, 2, state.firstGod && state.cosmicEgg.type == C.SEED, [OPENEGG, DRYLAND, MAKETREE])
                    .choice(function () {
                    return "The " + state.cosmicEgg + " sprouted and grew into " + state.worldTree + ". Its canopy became the sky and its roots the earth.";
                }, 2, state.cosmicEgg.type == C.SEED, [OPENEGG, DRYLAND, MAKETREE]);
                p
                    .choice([state.cosmicEgg + " " + rand.pick(["cracked open", "opened", "dissolved"]) + ", and water flowed out and " + rand.pick(["filled all of creation", "flooded everything"]) + ".",
                    state.cosmicEgg + " " + rand.pick(["cracked open", "opened", "dissolved"]) + ", and added water of life to the primal waters."
                ], 1, state.cosmicEgg.type != C.SEED && state.fromChaosStart == C.WATER, [OPENEGG, FLOOD]);
            }
        }
        if (state.firstGod) {
            p
                .choice(state.firstGod + " created the sky and the earth.", .3, state.fromChaosStart == C.VOID)
                .choice(state.firstGod + " shaped and crafted the primal chaos, creating the sky and the earth according to his own designs.", 1 + (state.firstGod.aspect == C.SMITH ? 2 : 0), state.fromChaosStart == C.CHAOS && state.firstGod.aspect == C.SMITH)
                .choice([
                state.firstGod + " sorted the primal chaos, creating the sky and the earth.",
            ], 1, state.fromChaosStart == C.CHAOS)
                .choice([
                state.firstGod + " cut the primal water, creating the sky and the earth.",
            ], 1, state.fromChaosStart == C.WATER);
        }
        if (state.firstGod) {
            // 4 directions
            var genders = state.rand.pick([
                [C.MALE, C.MALE, C.MALE, C.MALE],
                [C.MALE, C.MALE, C.FEMALE, C.FEMALE],
                [C.FEMALE, C.FEMALE, C.FEMALE, C.FEMALE],
            ]);
            state.rand.shuffle(genders);
            var d_gods_1 = [];
            for (var i in genders) {
                var e = new Entity(genders[i] == C.MALE ? state.nameGenM() : state.nameGenF());
                e.gender = genders[i];
                d_gods_1[i] = e;
            }
            d_gods_1[0].aspect = C.NORTH;
            d_gods_1[1].aspect = C.SOUTH;
            d_gods_1[2].aspect = C.EAST;
            d_gods_1[3].aspect = C.WEST;
            var ADDGODS = function () { Array.prototype.push.apply(state.gods, d_gods_1); };
            p.choice(function () {
                var dirs = ["North", "South", "East", "West"];
                for (var j = 0; j < 4; j++) {
                    d_gods_1[j].name += " the " + dirs[j] + " Wind";
                }
                return state.firstGod + " created " + d_gods_1[0] + ", " + d_gods_1[1] + ", " + d_gods_1[3] + ", and " + d_gods_1[3] + ", who  " + ((state.fromChaosStart == C.WATER) ? "separated the waters, creating the sky; and  " : "") + "pushed on the land spreading it in all 4 directions.";
            }, 1, true, [ADDGODS]);
            var d_anims_1 = [].concat(animals);
            state.rand.shuffle(d_anims_1);
            p.choice(function () {
                for (var j = 0; j < 4; j++) {
                    d_gods_1[j].name += " the " + cap1(d_anims_1[j]);
                    d_gods_1[j].type = d_anims_1[j];
                }
                return "After creating the sky and the earth, " + state.firstGod + " puts  " + d_gods_1[0] + " to the North, " + d_gods_1[1] + " to the South, " + d_gods_1[2] + " to the East, and " + d_gods_1[3] + " to the West, as guardians of the land.";
            }, 1, true, [ADDGODS]);
        }
        state.line(resolve(p.pick()));
        if (!state.flooded // Both earth and sky were created together
            && state.rand.chance(.6) && !fromtree) {
            // Earth and Sky are gods now
            var pair = state.nameGenPair();
            if (state.rand.chance(.5))
                pair = [state.nameGenM(), state.nameGenF()]; // non matching names
            // first one will be male name
            var m_god = new Entity(pair[0]);
            m_god.gender = C.MALE;
            var f_god = new Entity(pair[1]);
            f_god.gender = C.FEMALE;
            m_god.spouse = f_god;
            f_god.spouse = m_god;
            if (state.rand.chance(.5)) {
                state.earth_god = m_god;
                state.sky_god = f_god;
            }
            else {
                state.earth_god = f_god;
                state.sky_god = m_god;
            }
            state.earth_god.aspect = C.EARTH;
            state.sky_god.aspect = C.SKY;
            state.gods.push(state.earth_god);
            state.gods.push(state.sky_god);
            var MF = ["Mother", "Father"];
            state.earth_god.name += " the Earth" + MF[state.earth_god.gender == C.FEMALE ? 0 : 1];
            state.sky_god.name += " the Sky" + MF[state.sky_god.gender == C.FEMALE ? 0 : 1];
            state.line("The earth was " + state.earth_god + ", and the sky was " + state.sky_god + ".");
        }
    }
    function makeEarth(state) {
        var rand = state.rand;
        var p = new Picker(rand);
        var OPENEGG = function () { state.cosmicEgg.state = C.OPEN; };
        var SUN = function () { state.sun = true; };
        var actor;
        var ap = new Picker(rand);
        if (state.firstGod)
            ap.choice(state.firstGod, 2);
        if (state.gods.length > 0)
            ap.choice(state.gods);
        if (ap.numChoices() > 0)
            actor = ap.pick();
        if (actor) {
            p
                .choice(actor + " put remnants of the " + state.cosmicEgg + " and put it on the surface of the water, creating land.", 1, state.cosmicEgg && state.cosmicEgg.state == C.OPEN)
                .choice(actor + " turned " + state.cosmicEgg + " into the sun. The heat of the sun evaporated water and exposed dry land.", 1, state.cosmicEgg && state.cosmicEgg.state == C.CLOSED, [OPENEGG, SUN])
                .choice([
                actor + " created the sun and put it on the sky. The heat of the sun evaporated water and exposed dry land."
            ], 1, true, [SUN])
                .choice([
                actor + " dove deep into the water, found earth, and brought it to the surface. Thus he created land."
            ], 1)
                .choice([
                actor + " sent forth it's mighty tail, displacing water and exposing the land."
            ], 1, actor.type == C.FISH || actor.type == C.DRAGON || actor.type == C.SERPENT)
                .choice([
                actor + " flapped it's mighty wings, blowing away the water and exposing the land."
            ], 1, actor.type == C.BIRD || actor.type == C.DRAGON);
        }
        else {
            p
                .choice([
                "Fragments of " + state.cosmicEgg + " dropped on the surface of the water, becoming land."
            ], 1, state.cosmicEgg && state.cosmicEgg.state == C.OPEN)
                .choice([
                state.cosmicEgg + " became the sun. The heat of the sun evaporated water and exposed dry land."
            ], 1, state.cosmicEgg && state.cosmicEgg.state == C.CLOSED, [OPENEGG, SUN])
                .choice([
                "The sun was born. The heat of the sun evaporated water and exposed dry land."
            ], 1, false /* TODO disabled bad option */, [SUN])
                .choice([
                "Land formed spontaneously." // bad option
            ], 1, state.firstGod == null && state.cosmicEgg == null);
        }
        state.line(resolve(p.pick()));
        state.flooded = false;
    } // TODO: Smith god creates the world
    function makeSun(state) {
        if (state.sun)
            return;
        var rand = state.rand;
        var p = new Picker(rand);
        //let g = state.getFreeGod();
        var _a = findGodParentsAsString(state, .5), g = _a[0], parents = _a[1];
        var races = anded(state.races.map(function (r) { return cap1(cstr(r)); }));
        if (state.races.length == 0)
            races = null;
        var OPENEGG = function () { state.cosmicEgg.state = C.OPEN; };
        var SUN = function () { state.sun = true; };
        var godCreated = false;
        var GODCREATED = function () { godCreated = true; };
        p.choice("The sun materialized in the sky.", .5 // bad option
        , false)
            .choice("The sun emerged from " + state.cosmicEgg + " and lit up the world.", 1, state.cosmicEgg != null && state.cosmicEgg.state == C.CLOSED, [OPENEGG])
            .choice(g + " created the sun.", 1, g != null, [GODCREATED])
            .choice(races + " were cold and scared of the darkness, so " + g + " created the sun.", 1, races != null && g != null, [GODCREATED])
            .choice("A fruit grew on the branches of " + state.worldTree + ", and became the sun.", 1, state.worldTree != null)
            .choice("Two fruits grew on the branches of " + state.worldTree + ", one gold and one silver. One became the sun, and other the moon.", 1, state.worldTree != null && !state.moon, [function () { state.moon = true; }]);
        // X created the sun and set it on the sky.
        // The sun emerged from the egg and lit the world.
        // One flower/fruit grew on the world tree larger and larger until it became the sun.
        // 
        // The humans were cold and scared of the darkness. So X created the sun.
        // The humans were cold and scared of the darkness. so X took pity on them and became the sun.
        //
        // X became the sun.
        // X and Y becomes sun and moon.
        // X decided to sacrifice himself and becoem the Sun. 
        // X became the sun to battle Y(evil).
        // Sun (X) born from eye
        // Stories: Sun too close burned everything. Sun almost accident.
        // takes to teh sky chasing demons of darkness
        // Stands guard in sky protecting against demons.
        // Sun is too bright, battle to dim him/by consent. Pieces make other stuff.
        var pck = p.pick();
        if (pck) {
            SUN();
            state.line(pck);
        }
        if (godCreated)
            checkGodSpouseCheating(state, parents);
    }
    function makeMoon(state) {
        if (state.moon)
            return;
        var rand = state.rand;
        var p = new Picker(rand);
        var g = state.getFreeGod();
        var onerace = null;
        if (state.races.length > 0)
            onerace = state.rand.pick(state.races);
        var OPENEGG = function () { state.cosmicEgg.state = C.OPEN; };
        var MOON = function () { state.moon = true; };
        p.choice("The moon appeared in the sky.", .5 // bad option
        , false)
            .choice("The moon emerged from " + state.cosmicEgg + " and lit up the night sky.", 1, state.cosmicEgg != null && state.cosmicEgg.state == C.CLOSED, [OPENEGG])
            .choice(g + " created the moon.", 1, g != null)
            .choice("A fruit grew on the branches of " + state.worldTree + ", and became the moon.", 1, state.worldTree != null)
            .choice(function () {
            var girl = state.nameGenF();
            var bad = state.rand.pick(["an unwanted suitor", "an evil warlord", "her abusive husband", "her abusive brother"]);
            return girl + " was a fair maiden of the " + cstr(onerace) + ". She was running away from " + bad + ", when gods took mercy on her and made her the moon to protect her from harm forever.";
        }, .3, onerace != null)
            .choice(function () {
            var gender = state.rand.pick([0, 1]);
            var nm = state.nameGenPair()[gender];
            var status = ["king", "queen"][gender];
            var hisher = ["his", "her"][gender];
            var himher = ["him", "her"][gender];
            var heshe = ["he", "she"][gender];
            if (state.rand.chance(.3))
                status = "great hero";
            return nm + ", the " + status + " of the " + cstr(onerace) + " was so beloved by " + hisher + " people that gods made " + himher + " the moon, so that " + heshe + " can watch over " + hisher + " people.";
        }, .3, onerace != null);
        var pck = p.pick();
        if (pck) {
            MOON();
            state.line(pck);
        }
    }
    // Moon stories
    // X, wife of sun, becomes moon.
    // X becomes jealous of Sun/previous moon, becomes moon, still does not match the brightness of sun.
    // Y kills monster/god X. His body becomes the sun.
    // Borrowed brilliance from sun.
    // Note : story about why change phase. Eg chased by monster. Periodic sadness. aging and rebirth
    // Link to tide for sea people
    // Rain when moon cries/moon carries the rain water
    // 
    function makeRace(state) {
        if (state.races.length >= 3)
            return;
        if (state.races.length > 0 && state.rand.chance(.5))
            return;
        var r = [C.HUMANS, C.DWARVES, C.ELVES];
        for (var _i = 0, _a = state.races; _i < _a.length; _i++) {
            var r1 = _a[_i];
            remelem(r, r1);
        }
        var r2 = state.rand.pick(r);
        var race = cap1(cstr(r2));
        var orig = { HUMANS: "earth", ELVES: "forests", DWARVES: "mountains" }[C[r2]];
        //let g = state.getFreeGod();
        var _b = findGodParentsAsString(state, .5), g = _b[0], parents = _b[1];
        var godCreated = false;
        var GODCREATED = function () { godCreated = true; };
        var p = new Picker(state.rand);
        p
            .choice(race + " emerged from the " + orig + ".")
            .choice(g + " created the " + race + ".", 1, g != null, [GODCREATED])
            .choice(cap1(state.rand.pick(["leaves", "twigs", "bark", "buds", "seeds"])) + " dropped from " + state.worldTree + " and created the " + race + ".", 1, state.worldTree != null)
            .choice(function () {
            var mid = new Picker(state.rand)
                .choice(g + " spoke to the dolls.")
                .choice(g + " breathed on the dolls.")
                .choice(g + " wet them with the primal waters.", 1, state.fromChaosStart == C.WATER)
                .choice(g + " seeded them with essence of life from " + state.cosmicEgg + ".", 1, state.cosmicEgg != null && state.cosmicEgg.state == C.OPEN)
                .pick();
            return g + " created dolls from " + state.rand.pick(["clay", "mud", "dirt"]) + ". " + mid + " The dolls came to life and " + race + " were born.";
        }, 1, g != null, [GODCREATED]);
        state.line(p.pick());
        state.races.push(r2);
        if (godCreated)
            checkGodSpouseCheating(state, parents);
    }
    function makePlants(state) {
        if (state.plants)
            return;
        var races = anded(state.races.map(function (r) { return cap1(cstr(r)); }));
        if (state.races.length == 0)
            races = null;
        //let g = state.getFreeGod();
        var _a = findGodParentsAsString(state, 0), g = _a[0], parents = _a[1];
        var godCreated = false;
        var GODCREATED = function () { godCreated = true; };
        var p = new Picker(state.rand);
        p
            .choice(g + " created the plants and all things green.", 1, g != null, [GODCREATED])
            .choice(g + " created the plants so that " + races + " had things to grow and eat.", 1, g != null && races != null, [GODCREATED])
            .choice("Essence of the " + state.worldTree + " spread and covered the earth in plants and trees and forests.", 1, state.worldTree != null);
        var e = p.pick();
        if (e != null) {
            state.plants = true;
            state.line(e);
        }
        //if (godCreated)
        //    checkGodSpouseCheating(state, parents);//created by solo
    }
    function makeAnimals(state) {
        if (state.animals)
            return;
        var races = anded(state.races.map(function (r) { return cap1(cstr(r)); }));
        if (state.races.length == 0)
            races = null;
        //let g = state.getFreeGod();
        var _a = findGodParentsAsString(state, 0), g = _a[0], parents = _a[1];
        var godCreated = false;
        var GODCREATED = function () { godCreated = true; };
        var p = new Picker(state.rand);
        p
            .choice(g + " populated the earth with various animals.", 1, g != null, [GODCREATED])
            .choice(g + " created the animals so that " + races + " could herd and hunt.", 1, g != null && races != null, [GODCREATED]);
        var e = p.pick();
        if (e != null) {
            state.animals = true;
            state.line(e);
        }
        //if (godCreated)
        //    checkGodSpouseCheating(state, parents);//created by solo
    }
    function makeGods(state) {
        var rand = state.rand;
        var gn = cap1(state.ng_grp_pre.generate() + state.name_grp_suf);
        var grp = new Entity(gn);
        grp.grpCount = rand.pick([3, 5, 6, 7, 10, 12]);
        for (var i = 0; i < grp.grpCount; i++) {
            if (grp.grpCount - i >= 2 && rand.chance(.1)) {
                var np = rand.pick([state.nameGenPair(), [state.nameGenM(), state.nameGenF()]]);
                var g1 = new Entity(np[0]);
                var g2 = new Entity(np[1]);
                g1.gender = C.MALE;
                g2.gender = C.FEMALE;
                g1.spouse = g2;
                g2.spouse = g1;
                grp.members.push(g1);
                grp.members.push(g2);
                g1.group = grp;
                g2.group = grp;
                i++;
            }
            else {
                var g1 = new Entity(i % 2 == 0 ? state.nameGenM() : state.nameGenF());
                g1.gender = [C.MALE, C.FEMALE][i % 2];
                g1.group = grp;
                grp.members.push(g1);
            }
        }
        for (var i = 0; i < grp.members.length; i++) {
            var g1_1 = grp.members[i];
            g1_1.name = g1_1.name + " of the " + gn;
            if (g1_1.spouse == null && rand.chance(.6)) {
                for (var j = 0; j < grp.members.length; j++) {
                    var g2_1 = grp.members[j];
                    if (g1_1 != g2_1 && g1_1.gender != g2_1.gender && g2_1.spouse == null) {
                        g1_1.spouse = g2_1;
                        g2_1.spouse = g1_1;
                    }
                }
            }
        }
        grp.parents = findGodParents(state, 1, true);
        state.groups.push(grp);
        if (grp.parents.length == 0)
            state.line("The " + grp.grpCount + " " + grp + " came into existance.");
        else if (grp.parents.length == 1) {
            if (grp.parents[0] == state.cosmicEgg)
                state.line("From " + grp.parents[0] + " came the " + grp.grpCount + " " + grp + ".");
            else
                state.line(grp.parents[0] + " created the " + grp.grpCount + " " + grp + ".");
        }
        else
            state.line(grp.parents[0] + " and " + grp.parents[1] + " gave birth to the " + grp.grpCount + " " + grp + ".");
        checkGodSpouseCheating(state, grp.parents);
        /*
        let p = new Picker(rand);
        p.choice(`The ${grp} stood for goodness and justice.`);
        p.choice(`The ${grp} were vain, quarrelsome and evil.`);
        state.line(p.pick());
        */
    }
    function findGodParentsAsString(state, spouseChance) {
        if (spouseChance === void 0) { spouseChance = 1; }
        var parents = findGodParents(state, spouseChance);
        var g = null;
        //if (parents.length == 1 && parents[0] != state.cosmicEgg)
        //    parents = []
        if (parents.length == 1)
            g = "" + parents[0];
        else if (parents.length == 2)
            g = parents[0] + " and " + parents[1];
        return [g, parents];
    }
    function findGodParents(state, spouseChance, useCosmEgg) {
        if (spouseChance === void 0) { spouseChance = 1; }
        if (useCosmEgg === void 0) { useCosmEgg = false; }
        var parents = [];
        var rand = state.rand;
        var parent_pick = new Picker(rand);
        if (state.cosmicEgg != null && useCosmEgg)
            parent_pick.choice(state.cosmicEgg, .2);
        if (state.firstGod != null)
            parent_pick.choice(state.firstGod, .5);
        if (state.earth_god != null)
            parent_pick.choice(state.earth_god);
        for (var _i = 0, _a = state.groups; _i < _a.length; _i++) {
            var gg = _a[_i];
            for (var _b = 0, _c = gg.members; _b < _c.length; _b++) {
                var pg = _c[_b];
                parent_pick.choice(pg, pg.spouse != null ? 2 : 1);
            }
        }
        for (var _d = 0, _e = state.gods; _d < _e.length; _d++) {
            var pg = _e[_d];
            if (pg.group == null && pg != state.firstGod)
                parent_pick.choice(pg, pg.spouse != null ? 2 : 1);
        }
        var parent = parent_pick.pick();
        if (parent != null) {
            parents.push(parent);
            if (parent.spouse != null) {
                if (rand.chance(spouseChance))
                    parents.push(parent.spouse);
                return parents; // Done
            }
        }
        if (parent != null && parent.spouse == null
            && parent != state.cosmicEgg && parent != state.firstGod
            && rand.chance(spouseChance)) {
            var s_pick = new Picker(rand);
            for (var _f = 0, _g = state.gods; _f < _g.length; _f++) {
                var pg = _g[_f];
                if (pg.group == null && pg != state.firstGod // those in group already added
                    && pg.gender != parent.gender)
                    s_pick.choice(pg, pg.spouse == null ? 2 : 1); // Prefer unmarried
            }
            for (var _h = 0, _j = state.groups; _h < _j.length; _h++) {
                var gg = _j[_h];
                for (var _k = 0, _l = gg.members; _k < _l.length; _k++) {
                    var pg = _l[_k];
                    s_pick.choice(pg, pg.spouse == null ? 2 : 1); // Prefer unmarried
                }
            }
            var pspouse = s_pick.pick();
            if (pspouse != null)
                parents.push(pspouse);
        }
        return parents;
    }
    function checkGodSpouseCheating(state, ppl) {
        if (ppl == null || ppl.length < 2)
            return;
        if (ppl[0].spouse != null) {
            if (ppl[0].spouse == ppl[1])
                return;
            state.line("This infidelity angered " + ppl[0].spouse + ", spouse of " + ppl[0] + ".");
        }
        if (ppl[1].spouse != null) {
            if (ppl[1].spouse == ppl[0])
                return;
            state.line("This infidelity angered " + ppl[1].spouse + ", spouse of " + ppl[1] + ".");
        }
    }
    function makeWar(state) {
        if (state.groups.length < 1)
            return;
        var rand = state.rand;
        var p0 = rand.pick(state.groups);
        var p1 = null;
        if (state.groups.length > 1) {
            var g2 = [].concat(state.groups);
            remelem(g2, p0);
            p1 = rand.pick(g2);
        }
        if (p1 == null)
            p1 = rand.pick(p0.parents);
        if (p1 == null || p1 == state.cosmicEgg)
            return;
        if (p0 == p1)
            return;
        //state.line("SID_DEBUG "+state.groups);
        var onerace = null, allraces = null;
        if (state.races.length > 0)
            onerace = cap1(cstr(rand.pick(state.races)));
        if (state.races.length > 0)
            allraces = anded(state.races.map(function (r) { return cap1(cstr(r)); }));
        // TODO : dont fight same war
        state.line(rand.pick([
            "The " + p0 + " become jealous of " + p1 + "'s power.",
            "The " + p0 + " become afraid of " + p1 + "'s power.",
            "The " + p0 + " lust for " + p1 + "'s power.",
            "The " + p0 + " become tired of " + p1 + "'s stifling despotism."
        ])
            + (" The " + p0 + " begin a war with " + p1 + "."));
        var p = new Picker(rand); // TODO not destroyed but pieces fall off
        p.choice("The sun is destroyed in the war!", .6, state.sun, [function () { state.sun = false; }])
            .choice("The moon is destroyed in the war!", .6, state.moon, [function () { state.moon = false; }])
            .choice("The war across the heaven puts great scars across the moon. Pieces of the moon become embedded into the earth and become ores and precious gems.", 1, state.moon)
            .choice("The sun is damaged in the war but not extinguished. The sun now must recuperate at night and cannot always shine all the time. Droplets of the sun spread across the sky and become stars.", 1, state.sun && state.flags.SUN_EFFECT_1, [function () { state.flags.SUN_EFFECT_1 = true; }])
            .choice(p1 + " is injured in this battle. " + (p1.gender == C.MALE ? 'His' : 'Her') + " blood is sprinkled across the earth and becomes " + rand.pick(['precious gems', 'magically powerful crystals', 'holy relics', 'fountains of power']) + ".", 1, p1.members.length == 0)
            .choice(["In this turmoil, " + state.cosmicEgg + " breaks open and imbues the earth with Magic.",
            "In this turmoil, " + state.cosmicEgg + " breaks open and curses the world with Evil!"], 1, state.cosmicEgg && state.cosmicEgg.state == C.CLOSED, [function () { state.cosmicEgg.state = C.OPEN; }]) // TODO more detailed exciting outcomes
            .choice("The war puts the " + onerace + " in great misery.", 1, onerace != null)
            .choice("The conflict shakes heaven and earth.", 1);
        var pck = p.pick();
        if (pck != "")
            state.line(pck);
        state.wars++;
        /*
        var loser = null;
        if (p0.members.length > 0)
            loser = p0;
        if (p1.members.length > 0 && rand.chance(.5))
            loser = p1;
        */
        var loser = rand.pick([p0, p1]);
        //if (rand.chance(.5))
        {
            if (loser.members.length > 0) {
                state.line("The " + loser + " are eventually defeated and banished to live on earth as " + rand.pick(['monsters', 'demons', /*'animals',*/ 'haunted spirits']) + ".");
                // TODO allow them to become DORMANT instead
                remelem(state.groups, loser);
            }
            else
                state.line(loser + " is eventually defeated.");
        }
        //state.line(`SID_DEBUG sun ${state.sun} moon ${state.moon}`);
    }
    function findGodSiblingGroups(state, parents) {
        //for (var grp in 
    }
    function findGodConflicts(state) {
    }
    function generate() {
        var state = new MythState();
        var rand = state.rand;
        var b_temp = rand.pick([C.HOT, C.TEMPERATE, C.COLD]);
        var b_sea = rand.pick([C.SEA, C.NO_SEA]);
        var b_food = rand.pick([C.RICE, C.WHEAT, C.CORN]); //?FISH
        var b_anim = rand.pick([C.NONE, C.NONE, C.COW, C.SHEEP]);
        state.fromChaosStart = state.rand.pick([C.VOID, C.CHAOS, C.WATER]); // Air is same as void
        if (state.fromChaosStart == C.WATER)
            state.flooded = true;
        state.line("In the beginning, there was only " + cstr(state.fromChaosStart) + ".");
        var p = new Picker(rand);
        p
            .choice(function () { makeFirstGod(state); makeCosmicEgg(state); })
            .choice(function () { makeCosmicEgg(state); makeFirstGod(state); })
            .choice(function () { makeCosmicEgg(state); })
            .choice(function () { makeFirstGod(state); });
        p.pick();
        makeEarthSky(state);
        if (state.flooded && rand.chance(.5))
            makeEarth(state); // earth diver
        if (state.flooded)
            makeEarth(state); // earth diver
        var activeGods = [];
        if (state.firstGod) {
            /*
            if (rand.chance(.4))
            {
                state.line(`Then ${state.firstGod} entered a deep slumber.`);
                state.firstGod.state = C.DORMANT
            }
            else
                */
            {
                activeGods.push(state.firstGod);
            }
        }
        activeGods = activeGods.concat(state.gods);
        for (var i = 0; i < 50; i++) {
            var f = new Picker(state.rand)
                .choice(function () { makeSun(state); }, 1, !state.sun)
                .choice(function () { makeMoon(state); }, 1, !state.moon)
                .choice(function () { makeRace(state); })
                .choice(function () { makeGods(state); }, 1.2 - state.groups.length * .2)
                .choice(function () { makePlants(state); }, 2 + state.groups.length * .1, !state.plants)
                .choice(function () { makeAnimals(state); }, 2 + state.groups.length * .1, !state.animals)
                .choice(function () { makeWar(state); }, 1 - state.wars * .2)
                .pick();
            //state.line(`----------------- SID_DEBUG ${i}.`)
            if (state.sun && state.moon && state.races.length > 0
                && state.animals && state.plants
                && rand.chance(.6)) {
                //state.line(`SID_DEBUG DONE ${state.sun} ${state.moon} ${state.races.length} ${state.plants} ${state.animals}`)
                break;
            }
        }
        if (state.cosmicEgg != null && state.cosmicEgg.state == C.CLOSED)
            state.line(new Picker(rand)
                .choice(state.cosmicEgg + " still lie hidden. People fear the day it will bring forth the end of all creation.")
                .choice(state.cosmicEgg + " lies dormant. All races await the renewal that will come from it with great anticipation.")
                .pick());
        var header = "{Creation Mythology of the World of [" + state.nameGen() + "].}";
        return header + state.out;
    }
    /*
    for (var i = 0; i < 100; i++)
    {
        console.log(generate());
    }
    */
    var s = generate();
    console.log(s);
    var btn = '<input type="button" value="New" onclick="location.reload()"/>';
    var re = /\[/g;
    s = s.replace(re, '<span class="name">');
    re = /]/g;
    s = s.replace(re, '</span>');
    re = /\n/g;
    s = s.replace(re, '<br/>');
    //re = /{/g;
    s = s.replace(/{/g, '<h1>');
    s = s.replace(/}/g, '</h1>');
    s = btn + s;
    document.body.innerHTML = s;
});
/* WEIGHTED PICK TEST
let rand:RNG = new RNG(Math.random() * 99999999);
let p = beginPick(rand).choice(1, 1).choice(2, 10).choice(3, 10, false);

let cc = {};
cc[1] = 0; cc[2] =0; cc[3] =0;

for (var i = 0; i < 100000; i++)
{
    var x = p.pick();
    cc[x] = cc[x]+1;
}

console.log(cc);
*/ 
