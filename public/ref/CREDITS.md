# 外部素材与许可

## cat-silhouette.svg

- 来源：Wikimedia Commons，`File:Cat silhouette.svg`
  https://commons.wikimedia.org/wiki/File:Cat_silhouette.svg
- 许可：**Public domain**（Commons 页面标注为 pd，未署名作者）
- 取得日期：2026-10-15
- 用途：本片「CAT 的形态」只取它的**轮廓几何**——在 `tools/cat-contour.py` 里解析路径、
  采样、归一化，生成 `src/data/catForm.ts`。原图不进入成片画面；
  画面里的猫是代码粒子系统（`src/components/CatFoam.tsx`）沿该轮廓生成的发光粒子。

其余素材（少女立绘、音乐、歌词）均为主人提供，未使用其他网络素材。
