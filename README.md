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
```

## Reporting problems
In the issue, please add:
  * Any relevant messages from the HA log
  * Your config entry for the sensor entity
  * The sensor attributes. Screenshot or plain text.
  * Any relevant output from the browser dev tools console
