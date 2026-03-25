/**
 * 数组对象常用操作（优化版）
 * 目标：按“是否改原值”+“业务场景”来记忆，便于面试和实战。
 */

console.log("========== 1) 数组：会修改原数组的方法 ==========");
const arrMut = [1, 2, 3];
console.log("初始:", arrMut);

arrMut.push(4); // 末尾添加
console.log("push(4):", arrMut); // [1, 2, 3, 4]

arrMut.pop(); // 末尾删除并返回元素
console.log("pop():", arrMut); // [1, 2, 3]

arrMut.unshift(0); // 开头添加
console.log("unshift(0):", arrMut); // [0, 1, 2, 3]

arrMut.shift(); // 开头删除并返回元素
console.log("shift():", arrMut); // [1, 2, 3]

arrMut.splice(1, 1, 99); // 从索引1删除1个，再插入99
console.log("splice(1,1,99):", arrMut); // [1, 99, 3]

console.log("\n========== 2) 数组：不修改原数组的方法 ==========");
const arrPure = [1, 2, 3, 2];
console.log("原数组:", arrPure);

const subArray = arrPure.slice(1, 3); // 截取 [2, 3]
const mergedArray = arrPure.concat([7, 8]); // 合并新数组
const joined = arrPure.join("-"); // 转字符串

console.log("slice(1,3):", subArray);
console.log("concat([7,8]):", mergedArray);
console.log("join('-'):", joined);
console.log("原数组未变:", arrPure);

console.log("\n========== 3) 数组：查找与遍历 ==========");
console.log("indexOf(2):", arrPure.indexOf(2)); // 1
console.log("lastIndexOf(2):", arrPure.lastIndexOf(2)); // 3
console.log("includes(3):", arrPure.includes(3)); // true

arrPure.forEach((item, index) => {
  console.log(`forEach -> index:${index}, value:${item}`);
});

const doubled = arrPure.map((item) => item * 2);
const filtered = arrPure.filter((item) => item > 1);
const sum = arrPure.reduce((acc, item) => acc + item, 0);

console.log("map *2:", doubled);
console.log("filter >1:", filtered);
console.log("reduce 求和:", sum);

console.log("\n========== 4) 对象：增删改查 ==========");
const user = { name: "Alice", age: 30 };
user.city = "New York"; // 增加属性
user.age = 31; // 修改属性
delete user.age; // 删除属性
console.log("user:", user); // { name: 'Alice', city: 'New York' }

console.log("\n========== 5) 对象：遍历 ==========");
const profile = { name: "Alice", age: 30 };
for (const key in profile) {
  if (Object.prototype.hasOwnProperty.call(profile, key)) {
    console.log("for...in:", key, profile[key]);
  }
}
console.log("Object.keys:", Object.keys(profile));
console.log("Object.values:", Object.values(profile));
console.log("Object.entries:", Object.entries(profile));

console.log("\n========== 6) 对象：合并和浅拷贝 ==========");
const obj1 = { name: "Alice", info: { city: "Shenzhen" } };
const obj2 = { age: 30 };

const merged = Object.assign({}, obj1, obj2);
const copied = { ...obj1 };
console.log("Object.assign 合并:", merged);
console.log("展开运算符拷贝:", copied);
console.log("注意：以上都是浅拷贝，嵌套对象仍共享引用");

console.log("\n========== 7) 对象：freeze 与 seal ==========");
const frozenObj = { name: "Alice" };
Object.freeze(frozenObj);
frozenObj.name = "Bob"; // 无效（非严格模式下静默失败）
frozenObj.age = 30; // 无效
console.log("freeze 后:", frozenObj, "isFrozen:", Object.isFrozen(frozenObj));

const sealedObj = { name: "Alice" };
Object.seal(sealedObj);
sealedObj.name = "Bob"; // 可以修改已有属性
sealedObj.age = 30; // 无法新增
delete sealedObj.name; // 无法删除
console.log("seal 后:", sealedObj, "isSealed:", Object.isSealed(sealedObj));
