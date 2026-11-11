# Day 10 · C 轨题解 —— 最小覆盖子串（Hot 100 · 可变滑动窗口）

> **归属：Day 10 · C 轨（力扣 / 手撕）**
> 题目文件：`src/interview/min-window-substring.ts`；用例：`test/interview/min-window-substring.test.ts`（7 个）。
> **先自己限时 20 分钟写，再往下看。** 目标复杂度 O(n + m)。

## 一、题目

给定字符串 `s` 和 `t`，返回 `s` 中覆盖 `t` 全部字符的最短连续子串。覆盖要求**字符和出现次数都满足**。

```text
输入: s = "ADOBECODEBANC", t = "ABC"
输出: "BANC"

输入: s = "a", t = "a"
输出: "a"

输入: s = "a", t = "aa"
输出: ""        // t 有两个 a，s 只有一个
```

## 二、思路演化（面试时就这么讲）

**第一层：枚举所有子串。**

起终点两层循环，再统计是否覆盖 `t`，最坏 O(n³)，不可取。

**第二层：可变滑动窗口 + 频次表。**

右指针不断扩张，直到窗口覆盖 `t`；覆盖后左指针收缩，尽量去掉多余字符，同时记录最短答案；左指针移出必需字符后，窗口重新失配，右指针继续扩张。

**第三层：用 `missing` 代替每次遍历频次表。**

`need` 记录 `t` 中每个字符还缺多少个；`missing` 记录当前还缺多少个字符（含重复次数）。当 `missing === 0` 时窗口合法。

## 三、窗口的不变量

```text
[left, right] 是当前考察的连续窗口
need[ch] > 0：窗口还缺这个字符
need[ch] = 0：这个字符刚好满足
need[ch] < 0：窗口里这个字符多出来了
missing = sum(max(need[ch], 0))
```

右端加入字符时，如果它原本是需要的（`need[ch] > 0`），`missing--`；左端移除字符时，如果移除前它刚好不多（`need[ch] === 0`），`missing++`。

## 四、参考实现

```ts
export function minWindow(s: string, t: string): string {
  if (t.length === 0 || s.length < t.length) return "";

  const need = new Map<string, number>();
  for (const ch of t) {
    need.set(ch, (need.get(ch) ?? 0) + 1);
  }

  let missing = t.length;
  let left = 0;
  let bestStart = 0;
  let bestLen = Infinity;

  for (let right = 0; right < s.length; right++) {
    const rightCh = s[right];
    const rightCount = need.get(rightCh);

    if (rightCount !== undefined) {
      if (rightCount > 0) missing--;
      need.set(rightCh, rightCount - 1);
    }

    while (missing === 0) {
      const length = right - left + 1;
      if (length < bestLen) {
        bestLen = length;
        bestStart = left;
      }

      const leftCh = s[left];
      const leftCount = need.get(leftCh);

      if (leftCount !== undefined) {
        if (leftCount === 0) missing++;
        need.set(leftCh, leftCount + 1);
      }
      left++;
    }
  }

  return bestLen === Infinity ? "" : s.slice(bestStart, bestStart + bestLen);
}
```

## 五、走一遍标准用例

```text
s = A D O B E C O D E B A N C, t = A B C

right 扩张到 C：窗口 ADOBEC 覆盖 ABC，长度 6
左端收缩：A 是必需字符，移除后失配 → 当前最优 ADOBEC
继续扩张到下一个 A：窗口 ...EBA，仍不完整
扩张到 C：窗口 ADOBECODEBANC 覆盖 ABC
左端连续收缩，最终留下 BANC，长度 4
```

关键动作不是“每次覆盖就重置”，而是**覆盖后持续收缩左端**，直到丢失必需字符为止。

## 六、复杂度

- 时间：`right` 从左到右走一遍，`left` 也只向右走，合计 **O(n + m)**；
- 空间：`need` 只存 `t` 中出现的字符，**O(k)**，`k` 是 `t` 的字符集大小；
- 结果切片不计入辅助空间。

## 七、易错点

1. **把“覆盖”理解成包含字符种类，不包含次数**：`t = "aa"` 时窗口只有一个 `a` 不算覆盖。
2. **`missing` 初始化错**：应初始化为 `t.length`，因为重复字符也要逐步满足。
3. **右端加入时无条件 `missing--`**：只有 `need[ch] > 0` 才说明补上了缺口；多余字符会把频次压到负数。
4. **左端移除时无条件 `missing++`**：只有移除前 `need[ch] === 0` 才说明移走的是最后一个必需字符。
5. **覆盖后不收缩**：只能找到“某个覆盖窗口”，不一定最短。
6. **忘记保存起点**：只记录 `bestLen`，最后无法切片。
7. **`t` 为空或比 `s` 长**：直接返回空字符串。

## 八、面试追问

**Q1：为什么左指针不会回退，复杂度仍是 O(n)？**

`left` 只在窗口覆盖时向右收缩，整个过程中最多从 0 走到 n；`right` 也最多走 n 次，两者合计 O(n)。

**Q2：如果字符集包含中文或 emoji？**

把 `Map<string, number>` 当作频次表即可；如果按 UTF-16 码元遍历会把代理对拆开，需要按 code point 迭代（`for...of` 或 `Array.from`）并按完整字符计数。

**Q3：如果要求返回所有最短覆盖子串？**

记录 `bestLen` 后，遇到等长窗口也收集起点；注意去重和结果数量上限。核心滑动窗口不变。

**Q4：如果输入是流式数据？**

需要维护窗口内频次和 `missing`，但要保存窗口中的字符才能输出最短子串；如果只要求长度，可以只保留计数和左边界。

## 九、20 分钟自测标准

- [ ] 5 分钟内写出 `need + missing + left/right` 的主循环。
- [ ] 能解释 `need[ch] > 0` 与 `need[ch] === 0` 分别在判断什么。
- [ ] 能说清“先记录答案，再收缩左端”的顺序。
- [ ] 能通过标准用例、单字符、`t` 比 `s` 长、重复字符四个边界。
- [ ] 能口述 O(n + m) 时间、O(k) 空间。
