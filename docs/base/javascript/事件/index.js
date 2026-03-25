/*
  JS 事件对象（Event）实战
  打开同目录 index.html 可直接操作并看日志。
*/

const logBox = document.querySelector("#log");

function log(message) {
  if (!logBox) {
    console.log(message);
    return;
  }
  const row = document.createElement("div");
  row.textContent = message;
  logBox.prepend(row);
}

/* 1) 事件委托 + target/currentTarget 区别 */
const todoList = document.querySelector("#todoList");
if (todoList) {
  todoList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn || !todoList.contains(btn)) return;
    log(
      `[委托] target=${e.target.tagName}, currentTarget=${e.currentTarget.tagName}, data-id=${btn.dataset.id}`
    );
  });
}

/* 2) 阻止默认行为：preventDefault */
const jumpLink = document.querySelector("#jumpLink");
if (jumpLink) {
  jumpLink.addEventListener("click", (e) => {
    e.preventDefault();
    log("[preventDefault] 链接默认跳转已阻止，改为前端逻辑处理。");
  });
}

/* 3) 阻止冒泡：stopPropagation */
const card = document.querySelector("#card");
const buyBtn = document.querySelector("#buyBtn");
if (card && buyBtn) {
  card.addEventListener("click", () => {
    log("[冒泡] 点击事件到达 card 容器。");
  });

  buyBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    log("[stopPropagation] 只执行按钮逻辑，不触发 card 点击。");
  });
}

/* 4) 键盘事件：key/code */
const searchInput = document.querySelector("#searchInput");
if (searchInput) {
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      log(
        `[键盘] key=${e.key}, code=${e.code}, value="${searchInput.value.trim()}"`
      );
    }
  });
}

/* 5) 坐标信息：clientX/pageX */
const pointerArea = document.querySelector("#pointerArea");
if (pointerArea) {
  pointerArea.addEventListener("pointerdown", (e) => {
    log(
      `[坐标] client=(${e.clientX}, ${e.clientY}), page=(${e.pageX}, ${e.pageY})`
    );
  });
}

/* 6) 自定义事件：CustomEvent + detail */
const customBtn = document.querySelector("#dispatchCustom");
if (customBtn) {
  customBtn.addEventListener("click", () => {
    const event = new CustomEvent("cart:add", {
      bubbles: true,
      detail: {
        skuId: "SKU-1001",
        count: 1,
      },
    });
    customBtn.dispatchEvent(event);
  });

  document.addEventListener("cart:add", (e) => {
    log(`[自定义事件] type=${e.type}, detail=${JSON.stringify(e.detail)}`);
  });
}
