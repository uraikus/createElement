function crelm(elemAttr, options) {
  options = options || {
    replaceElement: false,
    deepClone: false,
    alwaysInsert: false,
    mergeChanges: false
  };
  elemAttr = elemAttr || {};
  if (typeof elemAttr !== "object")
    throw new Error(
      "crelm(elemAttr: Object, options: Object), elemAttr should only be an object or falsy!"
    );
  else if (Array.isArray(elemAttr)) {
    var elem = document.createDocumentFragment();
    makeDescendants(elem, elemAttr);
    return elem;
  }
  var tagName = elemAttr.tagName || elemAttr.tag || "div";
  var elem = document.getElementById(elemAttr.id);
  var preExisted = elem && !options.alwaysInsert;
  if (elem && options.replaceElement) elem.remove();
  if (
    elem &&
    !options.alwaysInsert &&
    !options.replaceElement &&
    !options.mergeChanges
  ) {
    elem.innerHTML = "";
    elem.style = "";
    for (var index in elem.attributes) {
      var attr = elem.attributes[index];
      elem.removeAttribute(attr);
    }
    for (var key in elem.dataset) {
      delete elem.dataset[key];
    }
  }
  if (/^frag$|^fragment$/i.test(tagName))
    elem = document.createDocumentFragment();
  else if (!elem || options.alwaysInsert || options.replaceElement)
    elem = document.createElement(tagName);
  elem.toJSON = toJSON;
  if (!preExisted && !options.replaceElement) {
    Object.defineProperty(elem, "text", {
      get: function() {
        return this.innerText;
      },
      set: function(val) {
        this.innerText = val;
      }
    });
    Object.defineProperty(elem, "html", {
      get: function() {
        return this.innerHTML;
      },
      set: function(val) {
        this.innerHTML = val;
      }
    });
    Object.defineProperty(elem, "clss", {
      get: function() {
        return this.className;
      },
      set: function(val) {
        this.className = val;
      }
    });
  }
  var parent = elemAttr.parentElement || elemAttr.parent || false;
  if (parent && parent.appendChild) parent.appendChild(elem);
  else if (typeof parent === "string")
    document.getElementById(parent).appendChild(elem);
  if (elemAttr.children) makeDescendants(elem, elemAttr.children);
  var shadow = elemAttr.shadow;
  if (typeof shadow === "object") {
    if (Array.isArray(shadow)) {
      var shadowRoot = elem.attachShadow({ mode: "open" });
      makeDescendants(shadowRoot, shadow);
    } else {
      var shadowRoot = elem.attachShadow({
        mode: shadow.closed ? "closed" : "open"
      });
      if (Array.isArray(shadow.children))
        makeDescendants(shadowRoot, shadow.children);
    }
  }
  for (var key in elemAttr) {
    if (
      [
        "parent",
        "parentElement",
        "tagName",
        "tag",
        "children",
        "shadow"
      ].indexOf(key) !== -1
    )
      continue;
    else if (
      (key === "style" && typeof elemAttr[key] === "object") ||
      key === "dataset"
    )
      deepClone(elem[key], elemAttr[key]);
    else if (key === "style") elem.setAttribute("style", elemAttr.style);
    else if (key === "attr" && typeof elemAttr[key] === "object")
      setAttributes(elem, elemAttr[key]);
    else if (typeof elemAttr[key] === "object" && options.deepClone)
      elem[key] = deepClone({}, elemAttr[key]);
    else elem[key] = elemAttr[key];
  }
  if (typeof elem.oncreate === "function") elem.oncreate(elem);
  return elem;

  function deepClone(obj1, obj2) {
    for (var key in obj2) {
      if (typeof obj2[key] === "object") obj1[key] = deepClone({}, obj2[key]);
      else obj1[key] = obj2[key];
    }
    return obj1;
  }
  function setAttributes(elem, attributes) {
    for (var attr in attributes) {
      elem.setAttribute(attr, attributes[attr]);
    }
  }
}

function makeDescendants(elem, children) {
  for (var x = 0; x < children.length; x++) {
    var child = children[x];
    if (!child) continue;
    else if (child instanceof Node) elem.appendChild(child);
    else if (typeof child === "string") {
      var textNode = document.createTextNode(child);
      elem.appendChild(textNode);
    } else if (typeof child === "object") {
      var childElement = crelm(child);
      elem.appendChild(childElement);
    } else {
      var textNode = document.createTextNode(child.toString());
      elem.appendChild(textNode);
    }
  }
}

function toJSON(element) {
  var elem = element instanceof Element ? element : this;
  var json = { dataset: {}, children: [] };
  for (var index in elem.attributes) {
    var attr = elem.attributes[index];
    if (attr.value) json[attr.name] = attr.value;
  }
  for (var index in elem.dataset) {
    json.dataset[index] = elem.dataset[index];
  }
  for (var x = 0; x < elem.childNodes.length; x++) {
    var node = elem.childNodes[x];
    if (node.tagName) json.children.push(toJSON(node));
    else json.children.push(node.textContent);
  }
  json.tagName = elem.tagName;
  if (/^input$/i.test(elem.tagName)) json.value = elem.value;
  else if (typeof elem.selectedIndex === "number")
    json.selectedIndex = elem.selectedIndex;
  return json;
}

module.exports = crelm;
