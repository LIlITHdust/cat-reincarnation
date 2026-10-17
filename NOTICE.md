# 素材与许可说明

这个仓库是一支**非商业同人作品**的完整工程：代码、数据与素材处理脚本。
它不包含音乐文件。以下逐项说明来源与许可，方便转载、二次创作或商用前判断。

## 1. 代码

`src/`、`tools/` 下的全部源代码以 **MIT** 许可发布，见 [`LICENSE`](LICENSE)。

## 2. 音乐

- 歌曲：nyamura《cat reincarnation》。
- **音频文件不在本仓库内**，`public/song.mp3` 已被 `.gitignore` 忽略。
- 词曲、录音与发行权归原作者与发行方所有。本仓库不对其做任何授权。
- 若要渲染本工程，请自备你**有权使用**的音频文件并放到 `public/song.mp3`。

## 3. 歌词文本

- `src/data/lyrics.ts` 与 `reference/*.lrc` 中引用了这首歌的歌词（日文原文与中文翻译），
  仅用于说明这支同人作品如何与歌曲对齐，版权归原作者所有。
- 如版权方有异议，请提 issue，会立即删除相关文本并改成结构相同的占位版本。

## 4. 场景照片

`public/scenes/*.png` 由以下 Wikimedia Commons 图片再处理（降采样、调色、抖动）而来：

| 文件 | 来源 | 许可 |
|---|---|---|
| piano.png | File:Old upright brown piano IMG1471.jpg | CC BY-SA 4.0 |
| rain.png | File:Rain on glass from below.jpg | CC BY-SA 4.0 |
| window.png | File:Rain window (7988700965).jpg | CC BY 2.0 |
| store.png | File:Snoozing at the Convenience Store (2706781132).jpg | CC BY 2.0 |
| train.png | File:Waiting for the night train - geograph.org.uk - 442199.jpg | CC BY-SA 2.0 |
| sea.png | File:Calm dusk.jpg | CC BY-SA 4.0 |
| boat.png | File:DSCF1281 A fishing boat moored on the shore at dusk.jpg | CC BY-SA 4.0 |

署名与原始链接见 [`public/scenes/CREDITS.md`](public/scenes/CREDITS.md)。
按 CC BY-SA 的要求，处理后的这些图片也以 **CC BY-SA 4.0** 提供；转载时请保留署名。

## 5. 其他素材

- **猫的轮廓**：Wikimedia Commons 的公有领域剪影（`public/ref/cat-silhouette.svg`），
  仅使用其几何轮廓生成点阵与粒子目标点。
- **角色姿势**：由 AI 图像模型（火山方舟 Seedream）生成，存于 `public/gen/`、`public/char/`。
- **字体**：Noto Sans SC / Noto Serif SC / Shippori Mincho B1 / Cormorant Garamond / JetBrains Mono，
  均为 SIL Open Font License 1.1；仓库里是**按片中用字子集化**后的 woff2
  （`tools/build-fonts.py` 可重建）。使用这些字体请遵守 OFL。

## 6. 片中出现的名字

`DEEPECHO`、`ASTER`、`CAT.REINCARNATION` 等均为片中虚构的模型名，与任何现实产品无关。
