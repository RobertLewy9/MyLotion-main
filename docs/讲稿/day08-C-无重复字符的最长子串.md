# Day 8 · C 轨题解 —— 无重复字符的最长子串（Hot 100 · 滑动窗口）

> **归属：Day 8 · C 轨（力扣 / 手撕）**
> 题目文件：`src/interview/longest-substring.ts`；用例：`test/interview/longest-substring.test.ts`（8 个）。
> **先自己限时 20 分钟写，再往下看。** 目标复杂度 O(n)。

## 一、题目

给定字符串 `s`，返回**不含重复字符的最长连续子串**长度。

```text
输入: s = "abcabcbb"
输出: 3        // "abc"

输入: s = "pwwkew"
输出: 3        // "wke" 或 "kew"，注意 "pwke" 不是子串
```

「子串」必须连续；「子序列」才可以跳着取，这两者不能混。

## 二、思路演化（面试时就这么讲）

**第一层：枚举所有子串** —— 起点和终点两层循环，再检查是否重复，最坏 O(n³)。

**第二层：固定左端，右端扩张** —— 用一个 Set 判断字符是否出现过，遇到重复就收缩左端。
每个字符最多进出窗口一次，时间 O(n)，空间 O(min(n, 字符集大小))。

**第三层：哈希记录上次位置** —— 不只记录“是否出现过”，而是记录某字符最后一次出现的下标。
右指针遇到重复字符时，左指针直接跳到 `上次位置 + 1`；不需要一个个字符地收缩。

关键细节是取最大值：

```ts
left = Math.max(left, lastIndex.get(ch)! + 1);
```

不能直接写 `left = lastIndex.get(ch) + 1`。例如 `"abba"`：

- 第二次遇到 `b` 时，`left` 跳到 2；
- 遇到最后一个 `a` 时，`a` 上次在 0，如果直接跳到 1，窗口反而向左退回去了。
- `Math.max` 保证左指针只能向右移动。

## 三、参考实现

```ts
export function lengthOfLongestSubstring(s: string): number {
  const lastIndex = new Map<string, number>();
  let left = 0;
  let best = 0;

  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    const previous = lastIndex.get(ch);

    if (previous !== undefined) {
      left = Math.max(left, previous + 1);
    }

    lastIndex.set(ch, right);
    best = Math.max(best, right - left + 1);
  }

  return best;
}
```

窗口含义：`[left, right]` 始终是一段无重复字符的连续子串。
每次右端加入新字符后：

- 如果字符没出现过，窗口继续扩张；
- 如果出现过，把左端跳到重复字符的后一位，恢复“窗口内无重复”；
- 用当前窗口长度更新最大值。

## 四、复杂度

- 时间：**O(n)**。`right` 从左到右扫一遍，`left` 只向右移动，两个指针合计最多走 O(n)。
- 空间：**O(min(n, k))**，`k` 是字符集大小。若只考虑 ASCII，可以近似 O(1)。

## 五、易错点

1. **把子串写成子序列**：`"pwwkew"` 的 `"pwke"` 不连续，不能算。
2. **左指针回退**：重复字符上次出现的位置可能在当前窗口外，必须 `Math.max`。
3. **更新顺序错**：先移动左指针，再更新当前位置，最后算长度；顺序反了会把重复字符留在窗口里。
4. **空字符串**：循环不执行，`best` 初始为 0 正好返回 0。
5. **把 `undefined` 当合法下标**：`Map.get` 返回 `undefined` 表示没出现过；下标 0 是合法值，不能写 `if (previous)`。

## 六、面试追问

**Q1：为什么时间复杂度是 O(n)，不是 O(n²)？**
虽然有一个内层“移动左指针”的动作，但 `left` 从不回退，最多从 0 走到 n-1；`right` 也最多走 n 次。
两个指针的总移动步数是 O(n)，不是每个右端都重新扫一遍窗口。

**Q2：如果要返回最长子串本身，而不只是长度？**
记录当前最佳窗口的起止下标 `bestStart`、`bestEnd`，最后 `s.slice(bestStart, bestEnd + 1)`。
仍然 O(n)，但返回字符串本身需要 O(k) 空间。

**Q3：字符串里有 emoji 怎么办？**
JS 的字符串下标按 UTF-16 code unit 计数，普通 emoji 可能占两个下标。若面试官强调 Unicode 字符，
可以先用 `Array.from(s)` 按码点拆成数组，再在数组上做同样的滑动窗口；思路不变。

## 七、20 分钟自测标准

- 5 分钟内写出滑动窗口主体；
- 说清为什么需要 `Math.max`；
- 通过 `abba`、`pwwkew`、空串三个反例；
- 能口述 O(n) 时间、O(min(n, k)) 空间。
