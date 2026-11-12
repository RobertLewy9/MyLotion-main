"use client";

// 自研建议菜单（斜杠菜单 / @提及共用）：对标 Notion 的列表式浮层。
// 通过 SuggestionMenuController 的 suggestionMenuComponent prop 注入，
// 完全绕开依赖 ComponentsContext 的包内默认菜单组件（裸 BlockNoteViewRaw 不提供该 context）。
import { Fragment } from "react";
import type { DefaultReactSuggestionItem, SuggestionMenuProps } from "@blocknote/react";

export default function MyLotionSuggestionMenu({
  items,
  loadingState,
  selectedIndex,
  onItemClick,
}: SuggestionMenuProps<DefaultReactSuggestionItem>) {
  if (loadingState === "loading-initial" || loadingState === "loading") {
    return <div className="mylotion-suggestion-menu mylotion-suggestion-menu--loading">加载中…</div>;
  }

  let lastGroup: string | undefined;
  return (
    <div className="mylotion-suggestion-menu" role="listbox">
      {items.map((item, index) => {
        const showLabel = item.group !== lastGroup;
        lastGroup = item.group;
        return (
          <Fragment key={`${item.title}-${index}`}>
            {showLabel && item.group && (
              <div className="mylotion-suggestion-menu-label">{item.group}</div>
            )}
            <button
              type="button"
              role="option"
              aria-selected={selectedIndex === index}
              className={
                selectedIndex === index
                  ? "mylotion-suggestion-menu-item is-selected"
                  : "mylotion-suggestion-menu-item"
              }
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onItemClick?.(item)}
            >
              {item.icon && <span className="mylotion-suggestion-menu-icon">{item.icon}</span>}
              <span className="mylotion-suggestion-menu-title">{item.title}</span>
              {item.subtext && (
                <span className="mylotion-suggestion-menu-subtext">{item.subtext}</span>
              )}
              {item.badge && <kbd className="mylotion-suggestion-menu-badge">{item.badge}</kbd>}
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
