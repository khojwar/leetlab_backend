const obj1 = {
    name: "test",
    age: 25,
    hobbies: ["reading", "gaming", "coding"],
}

const copy = Object.entries(obj1)

// console.log(copy);

for (const [key, value] of copy) {
    console.log(`key: ${key}, value`);
}




