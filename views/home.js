const iemail = document.querySelector("#input-email");
const btn = document.querySelector("#btn");

(function () {
  function isEmailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  iemail.addEventListener("focus", () => {
    iemail.classList.add("classed");
  });

  iemail.addEventListener("blur", blurFun);

  iemail.addEventListener("input", (e) => {
    if (isEmailValid(e.target.value)) {
      btn.classList.add("validate");
    } else {
      btn.classList.remove("validate");
    }
  });

  function blurFun() {
    if (this.value == "") {
      iemail.classList.remove("classed");
    }
  }
})();
