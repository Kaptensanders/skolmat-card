# skolmat-card custom card for Lovelace, Home Assistant 
A Lovelace card to present the current food menu in Swedish schools

## Description
This custom card is valid in Sweden. It depends on the skolmat custom component (https://github.com/Kaptensanders/skolmat) that populates entities from school menu rss feeds.

![image](https://user-images.githubusercontent.com/24979195/154963878-013bb9c0-80df-4449-9a8e-dc54ef0a3271.png)

## Dev status
This card was developed and tested with HA Core 2021.12.10 and the skolmat custom component 1.0.0. 

## Installation
1. Install the skolmat custom component (https://github.com/Kaptensanders/skolmat)
2. Put the contents of this repo in `.../<ha config>/www/skolmat-card/` (or clone this repo to your www folder)
3. In UI, go to Configuration->Dashboards->Resources and add a new entry:
   `/local/skolmat-card/src/skolmat-card.js?v=1.0.0`
4. Reload browser UI
5. Add the card to lovelace config:
```yaml
  - type: custom:skolmat-card
    entity: skolmat.skutehagen
    menu_type: today # [today or week]
```
  
## TODO:
* HACS installation 

  
