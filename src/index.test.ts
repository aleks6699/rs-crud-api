const getSum = (a: number, b: number) => a + b;


test('adds 1 + 2 to equal 3', () => {
  expect(getSum(1, 2)).toBe(3);
})