![hacs_badge](https://img.shields.io/badge/HACS-Default-41BDF5.svg?style=)
![Version](https://img.shields.io/github/v/release/Kaptensanders/skolmat-card)

# skolmat-card custom card for Lovelace, Home Assistant
A Lovelace card to present the current food menu in Swedish schools.

> **2.0 highlights**
> * Requires the `skolmat` integration version **3.0.0** or higher
> * Added support for lovelace visual UI editor 

## Description
This custom card is valid in Sweden. It depends on the skolmat custom component (https://github.com/Kaptensanders/skolmat) that populates entities from school menu rss feeds.

![image](https://user-images.githubusercontent.com/24979195/154963878-013bb9c0-80df-4449-9a8e-dc54ef0a3271.png)

## Installation
1. Install the skolmat custom component (https://github.com/Kaptensanders/skolmat)
2. Install this card with HACS, or manually put `skolmat-card.js` in your `www` folder and add as resource.
3. Add the card to Lovelace config:

```yaml
type: custom:skolmat-card
entity: sensor.skutehagen
menu_type: today # [today, week, rolling-week]
header: full # [full, short, school-name, none]
header_font: https://fonts.googleapis.com/css2?family=Inspiration&display=swap
header_fontsize: 2em
show_dates: false
rolling_week_max_days: 5
show_meals: if-multiple
show_dish_labels: if-multiple
locale: default # [default, en, sv]
```

## Lovelace configuration options

| Option | Supported values | Default | Description |
|---|---|---|---|
| `type` | `custom:skolmat-card` | **Required** | The card type. |
| `entity` | `sensor.<entity_id>` from `skolmat` integration | **Required** | Entity id for the skolmat sensor. |
| `menu_type` | `today`, `week`, `rolling-week` | `week` | Show menu for today only, current week, or a rolling list of upcoming days. |
| `header` | `full`, `short`, `school-name`, `none` | `full` | Header style: `full` = school + period, `short` = period only, `school-name` = school only, `none` = hidden. |
| `header_font` | Google Fonts stylesheet URL with `family=...`, or `none` | `https://fonts.googleapis.com/css?family=Mea+Culpa` | Custom header font URL. Use `none` to use theme/default font. |
| `header_fontsize` | Any valid CSS size (`2em`, `20px`, etc.) | `2em` | Header font size. |
| `show_dates` | `true`, `false` | `false` | Show date after weekday. Note: dates are always shown for `rolling-week`. |
| `rolling_week_max_days` | Integer `1` to `10` | `5` | Max number of non-empty days shown when `menu_type: rolling-week`. |
| `show_meals` | `none`, `always`, `if-multiple` | `if-multiple` | When to show meal group headers. |
| `show_dish_labels` | `none`, `always`, `if-multiple` | `if-multiple` | When to show dish labels. |
| `locale` | `default`, `en`, `sv` | `default` | Force card language or follow Home Assistant language. |

## Notes
- `show_dates` is only shown in the visual editor for `today`/`week`.
- `rolling_week_max_days` is only shown in the visual editor for `rolling-week`.
