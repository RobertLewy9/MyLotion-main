# Day 9 · C 轨题解 —— 找到字符串中所有字母异位词（Hot 100 · 滑动窗口）

> **归属：Day 9 · C 轨（力扣 / 手撕）**
> 题目文件：`src/interview/find-anagrams.ts`；用例：`test/interview/find-anagrams.test.ts`（7 个）。
> **先自己限时 20 分钟写，再往下看。** 目标复杂度 O(n)，字符串只含小写英文字母。

## 一、题目

给定字符串 `s` 和 `p`，找出 `s` 中所有 `p` 的字母异位词，返回这些子串的起始下标。

```text
输入: s = "cbaebabacd", p = "abc"
输出: [0, 6]
解释: "cba" 和 "bac" 都是 "abc" 的字母异位词

输入: s = "abab", p = "ab"
输出: [0, 1, 2]
```

字母异位词要求**长度相同、每个字符出现次数相同**，但顺序可以不同。目标子串必须连续。

## 二、思路演化（面试时就这么讲）

**第一层：枚举每个起点，再排序比较。**

对每个长度 `|p|` 的窗口排序后和 `p` 比较，时间约 O(n · |p| log |p|)，没有必要。

**第二层：固定长度滑动窗口 + 字符频次。**

因为异位词长度一定等于 `p`，所以窗口长度固定；每次只加入右侧字符、移除左侧字符，不用重新统计整个窗口。

**第三层：用 `matches` 记录多少个字符的频次已经相等。**

如果每个窗口都遍历 26 个字母比较，虽然是常数级，但还可以更直接：维护 `need` 和 `window` 两个 26 长度数组，以及“已经匹配的字符种数” `matches`。`matches === 26` 时当前窗口就是答案。

每次增删字符时，只更新受影响的字母：

```text
改动前频次相等 → matches--
修改频次
改动后频次相等 → matches++
```

## 三、参考实现

```ts
export function findAnagrams(s: string, p: string): number[] {
  const result: number[] = [];
  const n = s.length;
  const m = p.length;
  if (m === 0 || n < m) return result;

  const need = new Array<number>(26).fill(0);
  const window = new Array<number>(26).fill(0);

  for (const ch of p) {
    need[ch.charCodeAt(0) - 97]++;
  }

  let matches = 0;
  for (let i = 0; i < 26; i++) {
    if (need[i] === window[i]) matches++;
  }

  for (let right = 0; right < n; right++) {
    const add = s.charCodeAt(right) - 97;

    if (window[add] === need[add]) matches--;
    window[add]++;
    if (window[add] === need[add]) matches++;

    if (right >= m) {
      const remove = s.charCodeAt(right - m) - 97;

      if (window[remove] === need[remove]) matches--;
      window[remove]--;
      if (window[remove] === need[remove]) matches++;
    }

    if (matches === 26) {
      result.push(right - m + 1);
    }
  }

  return result;
}
```

窗口含义：处理到 `right` 后，`window` 始终表示当前长度不超过 `m` 的窗口频次。长度达到 `m` 时，如果所有 26 个字母的频次都与 `p` 一致，就记录起点 `right - m + 1`。

## 四、复杂度

- 时间：**O(n + 26)**，26 是固定字符集大小，因此记为 **O(n)**。每个字符最多进出窗口一次。
- 空间：**O(1)**，两个长度固定为 26 的数组，答案数组不计入辅助空间。

## 五、易错点

1. **窗口长度不固定**：异位词长度一定等于 `p`，所以每次右移都要移除最左侧字符。
2. **先加后删的顺序**：当前右端加入后，窗口可能暂时变成 `m + 1`；随后移除 `right - m`，窗口恢复为 `m`。
3. **`matches` 更新时机错**：先判断旧频次是否相等，再修改，最后判断新频次是否相等。
4. **字符集假设**：本解法按下标 `charCode - 97` 映射小写字母；若字符集不固定，应改用 `Map`。
5. **`p` 为空或比 `s` 长**：直接返回 `[]`，避免无效窗口。
6. **把异位词当成子序列**：答案必须是连续子串，不能跳过字符。

## 六、面试追问

**Q1：为什么固定窗口是 O(n)，不是 O(26n)？**

26 是题面限定的字符集大小，不随输入规模增长，所以是常数；每个字符仍只被加入和移除各一次。

**Q2：如果字符包含中文、emoji，或者字符集不固定？**

把 26 数组换成 `Map<string, number>`，`matches` 改为统计 `need` 中实际出现的字符种数；滑动窗口结构不变，但哈希操作带来额外常数。

**Q3：能不能用一个数组做差分，而不是 `need + window`？**

可以。维护 `diff[26] = window - need`，并用“非零个数”判断是否匹配；每次增删只更新一个位置，思路等价。

## 七、20 分钟自测标准

- 5 分钟内写出定长滑动窗口主体；
- 说清为什么窗口长度固定，以及 `right - m` 为什么是要移除的位置；
- 能解释 `matches` 的增删更新时机；
- 通过 `cbaebabacd`、`abab`、`p` 比 `s` 长、重复字符四个边界；
- 能口述 O(n) 时间、O(1) 辅助空间。
