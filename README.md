[![hacs_badge](https://img.shields.io/badge/HACS-Default-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)
![Maintenance](https://img.shields.io/maintenance/yes/2022?style=for-the-badge)

[![hacs_badge](https://img.shields.io/badge/dynamic/json?color=41BDF5&logo=home-assistant&label=integration%20usage&suffix=%20installs&cacheSeconds=15600&url=https://analytics.home-assistant.io/custom_integrations.json&query=$.skolmat.total)

# skolmat-card custom card for Lovelace, Home Assistant 
A Lovelace card to present the current food menu in Swedish schools

## Description
This custom card is valid in Sweden. It depends on the skolmat custom component (https://github.com/Kaptensanders/skolmat) that populates entities from school menu rss feeds.

![image](https://user-images.githubusercontent.com/24979195/154963878-013bb9c0-80df-4449-9a8e-dc54ef0a3271.png)

## Installation
1. Install the skolmat custom component (https://github.com/Kaptensanders/skolmat)
2. Install this card with HACS, or manually put skolmat-card.js in your www folder and add as resource.
3. Add the card to lovelace config:
```
  - type: custom:skolmat-card
    entity: skolmat.skutehagen
    menu_type: today # [today or week]
    header: full # [full, short or none]
    header_font: https://fonts.googleapis.com/css2?family=Inspiration&display=swap
    header_fontsize: 2em
```
## Lovelace configuration options

| Option           | Supported values           | Default                                             | Description                                  |
|------------------|----------------------------|-----------------------------------------------------|----------------------------------------------|
|`type`            |`custom:skolmat-card`       |**Required**                                         |The card type                                |
|`entity`          |*skolmat entity id*         |**Required**                                         |Entity id, like `skolmat.nibbleskolan`       |
|`menu_type`       |`today`, `week`             | `week`                                              |Show today only or full week menu            |
|`header`          |`full`, `short`, `none`     | `full`                                              |`full` - School name and time span <br>`short` - Time span <br> `none` - No header  |
|`header_font`     |*google fonts url* or <br>`none` for theme font          |`https://fonts.googleapis.com/css?family=Mea+Culpa`  |The `href` parameter of the link tag provided at google fonts site|
|`header_fontsize` |`2em`, `20px`, etc          |`1.5em`                                              | any valid css size specifier                 |

