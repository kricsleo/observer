function isChild(child: Element, parent: null | Document | Element) {
  return !parent || (parent !== child && parent.contains(child));
}

function isElement(el?: any) {
  return el?.nodeType === Node.ELEMENT_NODE
}