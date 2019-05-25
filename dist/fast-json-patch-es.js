// fast-json-patch, version: 2.1.0
Object.defineProperty(exports, "__esModule", {
  value: true
});
/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * (c) 2017 Joachim Wester
 * MIT license
 */

var helpers_1 = require("./helpers");

var core_1 = require("./core");
/* export all core functions */


var core_2 = require("./core");

exports.applyOperation = core_2.applyOperation;
exports.applyPatch = core_2.applyPatch;
exports.applyReducer = core_2.applyReducer;
exports.getValueByPointer = core_2.getValueByPointer;
exports.validate = core_2.validate;
exports.validator = core_2.validator;
/* export some helpers */

var helpers_2 = require("./helpers");

exports.JsonPatchError = helpers_2.PatchError;
exports.deepClone = helpers_2._deepClone;
exports.escapePathComponent = helpers_2.escapePathComponent;
exports.unescapePathComponent = helpers_2.unescapePathComponent;
var beforeDict = new WeakMap();

var Mirror =
/** @class */
function () {
  function Mirror(obj) {
    this.observers = new Map();
    this.obj = obj;
  }

  return Mirror;
}();

var ObserverInfo =
/** @class */
function () {
  function ObserverInfo(callback, observer) {
    this.callback = callback;
    this.observer = observer;
  }

  return ObserverInfo;
}();

function getMirror(obj) {
  return beforeDict.get(obj);
}

function getObserverFromMirror(mirror, callback) {
  return mirror.observers.get(callback);
}

function removeObserverFromMirror(mirror, observer) {
  mirror.observers.delete(observer.callback);
}
/**
 * Detach an observer from an object
 */


function unobserve(root, observer) {
  observer.unobserve();
}

exports.unobserve = unobserve;
/**
 * Observes changes made to an object, which can then be retrieved using generate
 */

function observe(obj, callback) {
  var patches = [];
  var observer;
  var mirror = getMirror(obj);

  if (!mirror) {
    mirror = new Mirror(obj);
    beforeDict.set(obj, mirror);
  } else {
    var observerInfo = getObserverFromMirror(mirror, callback);
    observer = observerInfo && observerInfo.observer;
  }

  if (observer) {
    return observer;
  }

  observer = {};
  mirror.value = helpers_1._deepClone(obj);
  var fastCheck;

  if (callback) {
    observer.callback = callback;
    observer.next = null;

    var dirtyCheck_1 = function () {
      generate(observer);
    };

    fastCheck = function () {
      clearTimeout(observer.next);
      observer.next = setTimeout(dirtyCheck_1);
    };

    if (typeof window !== 'undefined') {
      //not Node
      if (window.addEventListener) {
        //standards
        window.addEventListener('mouseup', fastCheck);
        window.addEventListener('keyup', fastCheck);
        window.addEventListener('mousedown', fastCheck);
        window.addEventListener('keydown', fastCheck);
        window.addEventListener('change', fastCheck);
      } else {
        //IE8
        document.documentElement.attachEvent('onmouseup', fastCheck);
        document.documentElement.attachEvent('onkeyup', fastCheck);
        document.documentElement.attachEvent('onmousedown', fastCheck);
        document.documentElement.attachEvent('onkeydown', fastCheck);
        document.documentElement.attachEvent('onchange', fastCheck);
      }
    }
  }

  observer.patches = patches;
  observer.object = obj;

  observer.unobserve = function () {
    generate(observer);
    clearTimeout(observer.next);
    removeObserverFromMirror(mirror, observer);

    if (typeof window !== 'undefined') {
      if (window.removeEventListener) {
        window.removeEventListener('mouseup', fastCheck);
        window.removeEventListener('keyup', fastCheck);
        window.removeEventListener('mousedown', fastCheck);
        window.removeEventListener('keydown', fastCheck);
      } else {
        document.documentElement.detachEvent('onmouseup', fastCheck);
        document.documentElement.detachEvent('onkeyup', fastCheck);
        document.documentElement.detachEvent('onmousedown', fastCheck);
        document.documentElement.detachEvent('onkeydown', fastCheck);
      }
    }
  };

  mirror.observers.set(callback, new ObserverInfo(callback, observer));
  return observer;
}

exports.observe = observe;
/**
 * Generate an array of patches from an observer
 */

function generate(observer) {
  var mirror = beforeDict.get(observer.object);

  _generate(mirror.value, observer.object, observer.patches, "");

  if (observer.patches.length) {
    core_1.applyPatch(mirror.value, observer.patches);
  }

  var temp = observer.patches;

  if (temp.length > 0) {
    observer.patches = [];

    if (observer.callback) {
      observer.callback(temp);
    }
  }

  return temp;
}

exports.generate = generate; // Dirty check if obj is different from mirror, generate patches and update mirror

function _generate(mirror, obj, patches, path) {
  if (obj === mirror) {
    return;
  }

  if (typeof obj.toJSON === "function") {
    obj = obj.toJSON();
  }

  var newKeys = helpers_1._objectKeys(obj);

  var oldKeys = helpers_1._objectKeys(mirror);
  var deleted = false; //if ever "move" operation is implemented here, make sure this test runs OK: "should not generate the same patch twice (move)"

  for (var t = oldKeys.length - 1; t >= 0; t--) {
    var key = oldKeys[t];
    var oldVal = mirror[key];

    if (helpers_1.hasOwnProperty(obj, key) && !(obj[key] === undefined && oldVal !== undefined && Array.isArray(obj) === false)) {
      var newVal = obj[key];

      if (typeof oldVal == "object" && oldVal != null && typeof newVal == "object" && newVal != null) {
        _generate(oldVal, newVal, patches, path + "/" + helpers_1.escapePathComponent(key));
      } else {
        if (oldVal !== newVal) {
          patches.push({
            op: "replace",
            path: path + "/" + helpers_1.escapePathComponent(key),
            value: helpers_1._deepClone(newVal)
          });
        }
      }
    } else if (Array.isArray(mirror) === Array.isArray(obj)) {
      patches.push({
        op: "remove",
        path: path + "/" + helpers_1.escapePathComponent(key)
      });
      deleted = true; // property has been deleted
    } else {
      patches.push({
        op: "replace",
        path: path,
        value: obj
      });
    }
  }

  if (!deleted && newKeys.length == oldKeys.length) {
    return;
  }

  for (var t = 0; t < newKeys.length; t++) {
    var key = newKeys[t];

    if (!helpers_1.hasOwnProperty(mirror, key) && obj[key] !== undefined) {
      patches.push({
        op: "add",
        path: path + "/" + helpers_1.escapePathComponent(key),
        value: helpers_1._deepClone(obj[key])
      });
    }
  }
}
/**
 * Create an array of patches from the differences in two objects
 */


function compare(tree1, tree2) {
  var patches = [];

  _generate(tree1, tree2, patches, '');

  return patches;
}

exports.compare = compare;
