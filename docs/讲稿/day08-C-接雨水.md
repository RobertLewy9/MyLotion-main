# Day 8 · C 轨题解 —— 接雨水（Hot 100 · 双指针）

> **归属：Day 8 · C 轨（力扣 / 手撕）**
> 题目文件：`src/interview/trap-rain-water.ts`；用例：`test/interview/trap-rain-water.test.ts`（8 个）。
> **先自己限时 20 分钟写，再往下看。** 先写 O(n) 空间的左右最大值，再尝试优化到 O(1)。

## 一、题目

给定非负整数数组 `height`，每个数表示一根宽度为 1 的柱子高度。
下雨后，柱子之间能接住多少单位的水？

```text
输入: height = [0,1,0,2,1,0,1,3,2,1,2,1]
输出: 6

输入: height = [4,2,3]
输出: 1
```

位置 `i` 能接多少水，不是看左右相邻的柱子，而是看**它左边最高的柱子**和**右边最高的柱子**：

```text
waterAt(i) = max(0, min(leftMax[i], rightMax[i]) - height[i])
```

水会被较矮的那一侧挡住，所以取 `min`；柱子本身高度要从容量里扣掉。

## 二、思路演化

### 第一层：逐列计算

对每个位置 `i`，分别向左、向右找最高柱子，然后套公式。每个位置扫两遍，时间 O(n²)。

### 第二层：预处理左右最大值

先从左往右算出 `leftMax[i]`，再从右往左算出 `rightMax[i]`，最后扫一遍累加。
时间 O(n)，空间 O(n)。

```ts
export function trap(height: number[]): number {
  const n = height.length;
  if (n === 0) return 0;

  const leftMax = new Array<number>(n);
  const rightMax = new Array<number>(n);

  leftMax[0] = height[0];
  for (let i = 1; i < n; i++) {
    leftMax[i] = Math.max(leftMax[i - 1], height[i]);
  }

  rightMax[n - 1] = height[n - 1];
  for (let i = n - 2; i >= 0; i--) {
    rightMax[i] = Math.max(rightMax[i + 1], height[i]);
  }

  let water = 0;
  for (let i = 0; i < n; i++) {
    water += Math.min(leftMax[i], rightMax[i]) - height[i];
  }
  return water;
}
```

这个版本最容易讲清楚，面试如果先写出它，是及格解法；被问“能不能 O(1) 空间”再往双指针优化。

### 第三层：双指针 O(1) 空间

维护 `left`、`right` 两个指针，以及它们各自扫过的最高柱子 `leftMax`、`rightMax`。

每次处理**较矮的一侧**：

- 若 `height[left] < height[right]`，右侧至少有一根不低于左当前高度的柱子，
  左侧位置能接多少水只由 `leftMax` 决定；
- 反之处理右指针，右侧位置只由 `rightMax` 决定。

## 三、参考实现（双指针）

```ts
export function trap(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      water += leftMax - height[left];
      left++;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      water += rightMax - height[right];
      right--;
    }
  }

  return water;
}
```

为什么可以先更新最大值再加水？

- 如果当前柱子刷新了 `leftMax`，说明它比之前高，`leftMax - height[left]` 正好是 0；
- 如果没刷新，说明左边有更高的墙，`leftMax - height[left]` 就是这一列的水量。

两种写法顺序都对，但先更新最大值再算差值，可以省掉一个 `Math.max(0, ...)`。

## 四、复杂度

- 时间：**O(n)**。`left` 和 `right` 相向而行，每个下标最多访问一次。
- 空间：**O(1)**。只用了四个标量。

预处理版本是 O(n) / O(n)，双指针是 O(n) / O(1)。

## 五、易错点

1. **只看相邻柱子**：水量由左右两侧的最高边界共同决定，不是简单的 `min(height[i-1], height[i+1]) - height[i]`。
2. **循环条件写成 `left <= right`**：会重复处理同一个柱子；两指针相遇时就应停止。
3. **用错高度比较方向**：一定要先处理较矮的一侧，否则无法用一侧最大值代替另一侧未知最大值。
4. **空数组 / 单柱**：长度为 0 或 1 时直接返回 0；双指针版天然不会进入循环。
5. **更新顺序写反**：应先 `leftMax = Math.max(...)`，再 `water += leftMax - height[left]`。

## 六、面试追问

**Q1：为什么较矮的一侧可以由本侧最大值决定？**
假设 `height[left] < height[right]`。右侧存在一根不矮于 `height[left]` 的柱子，
所以右侧最高值至少不低于左侧当前高度；此时左侧位置的水面高度由 `leftMax` 限制，
不必等右侧所有高度的信息。处理完左端后，问题规模缩小到 `[left + 1, right]`。

**Q2：能不能用单调栈做？**
可以。维护一个高度单调递减的下标栈，遇到比栈顶高的柱子时结算凹槽；时间 O(n)，空间 O(n)。
双指针更适合面试口述，单调栈更适合按“柱状图中最大矩形”那一类模板统一复习。

**Q3：如果柱子宽度不是 1 呢？**
每列水量乘以对应宽度即可。当前双指针实现每次处理一根柱子，若是变宽柱，需要额外维护当前柱子的宽度；
思路不变，但要在累加时乘宽度。

## 七、20 分钟自测标准

- 先说清 `min(leftMax, rightMax) - height[i]` 的公式；
- 能写出 O(n) 空间的预处理版；
- 能推出双指针版，并解释为什么只处理较矮的一侧；
- 通过递增、递减、空数组、单柱四个边界。
