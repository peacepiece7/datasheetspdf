# type assertion (타입 단언)
```ts
let someValue: any = "this is a string";

let strLength: number = (someValue as string).length;

// 2 width height만 인자로 받을 경우 아래와 같이 가능 단 파라매터 하나 이상 일치해야 함
let mySquare = createSquare({ width: 100, opacity: 0.5 } as SquareConfig);
```

# never

```ts
// never를 반환하는 함수는 함수의 마지막에 도달할 수 없다.
function error(message: string): never {
    throw new Error(message);
}

// 반환 타입이 never로 추론된다.
function fail() {
    return error("Something failed");
}

// never를 반환하는 함수는 함수의 마지막에 도달할 수 없다.
function infiniteLoop(): never {
    while (true) {
    }
}
```


# interface 

## readonly properies
## optional properties

# literal types

```ts

// @errors: 2345
type Easing = "ease-in" | "ease-out" | "ease-in-out";

class UIElement {
  animate(dx: number, dy: number, easing: Easing) {
    if (easing === "ease-in") {
      // ...
    } else if (easing === "ease-out") {
    } else if (easing === "ease-in-out") {
    } else {
      // 하지만 누군가가 타입을 무시하게 된다면
      // 이곳에 도달하게 될 수 있습니다.
    }
  }
}

/** @type {string} **/


let button = new UIElement();
button.animate(0, 0, "ease-in");
button.animate(0, 0, "uneasy");
```
