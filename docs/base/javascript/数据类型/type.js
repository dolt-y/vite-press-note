/**
 * JS 数据类型（可直接运行观察输出）
 *
 * 1) 基本类型（7 个）:
 *    undefined / null / boolean / number / string / symbol / bigint
 * 2) 引用类型:
 *    object（数组、函数、日期、正则、Map、Set...都属于对象）
 */

// ---------- 1) 最常用的三种判断 ----------
// typeof: 适合判断基本类型（但 null/array 不准确）
// instanceof: 适合判断“某构造函数实例”
// Object.prototype.toString.call: 细粒度、通用

function getTag(value) {
  return Object.prototype.toString.call(value); // 例如: [object Array]
}

function getType(value) {
  if (value === null) return "null";
  const baseType = typeof value;
  if (baseType !== "object") return baseType;
  if (Array.isArray(value)) return "array";
  return getTag(value).slice(8, -1).toLowerCase();
}

const samples = {
  undefined: undefined,
  null: null,
  boolean: true,
  number: 123,
  string: "hello",
  symbol: Symbol("id"),
  bigint: 10n,
  object: { name: "obj" },
  array: [1, 2, 3],
  func: function fn() {},
  date: new Date(),
  regexp: /abc/,
  map: new Map(),
  set: new Set(),
};

console.log("name".padEnd(12), "|", "typeof".padEnd(10), "|", "toStringTag");
for (const [name, value] of Object.entries(samples)) {
  console.log(name.padEnd(12), "|", String(typeof value).padEnd(10), "|", getTag(value));
}

// ---------- 2) 常见坑 ----------
console.log("\n[常见坑]");
console.log("typeof null =>", typeof null); // object（历史遗留问题）
console.log("typeof [] =>", typeof []); // object（数组本质是对象）
console.log("[] instanceof Array =>", [] instanceof Array); // true
console.log("[] instanceof Object =>", [] instanceof Object); // true
console.log("123 instanceof Number =>", 123 instanceof Number); // false（原始值不是实例）

// ---------- 3) 实战建议 ----------
console.log("\n[实战建议]");
console.log("1. 判断 null: value === null");
console.log("2. 判断数组: Array.isArray(value)");
console.log("3. 其他复杂对象: Object.prototype.toString.call(value)");
console.log("4. 统一封装: getType(value) =>", getType(samples.array), getType(samples.null));
