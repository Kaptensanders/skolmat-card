const LitElement = customElements.get("ha-panel-lovelace") ? Object.getPrototypeOf(customElements.get("ha-panel-lovelace")) : Object.getPrototypeOf(customElements.get("hc-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;


window.customCards = window.customCards || [];
window.customCards.push({
  type: "skolmat-card",
  name: "Skolmat card",
  description: "Card to display the food menu in swedish schools. Relies on the skolmat integration",
  preview: false,
  documentationURL: "https://github.com/Kaptensanders/skolmat-card",
});


function hasConfigOrEntityChanged(element, changedProps) {
  if (changedProps.has("_config")) {
    return true;
  }

  const oldHass = changedProps.get("hass");
  if (oldHass) {
    return (
      oldHass.states[element._config.entity] !== element.hass.states[element._config.entity] ||
      oldHass.states[element._config.menu_type] !== element.hass.states[element._config.menu_type]);
  }

  return true;
}

Date.prototype.getWeek = function() {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
}

class SkolmatCard extends LitElement {
  static get properties() {
    return {
      _config: {},
      hass: {},
    };
  }

  constructor() {
    super();
    const fontEl = document.createElement('link');
    fontEl.rel = 'stylesheet';
    fontEl.href = 'https://fonts.googleapis.com/css?family=Mea Culpa';
    document.head.appendChild(fontEl);
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Please define a skolmat entity");
    }
    else if (!config.menu_type || (config.menu_type != "today" && config.menu_type != "week")) {
      throw new Error("config: 'menu_type' missing or not 'today' or 'week");
    }
    this._config = config;
  }

  shouldUpdate(changedProps) {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  render() {
    if (!this._config || !this.hass) {
      return html``;
    }

    this.numberElements = 0;
    const stateObj = this.hass.states[this._config.entity];

    if (!stateObj) {
      return html`
        <style>
          .not-found {
            flex: 1;
            background-color: yellow;
            padding: 8px;
          }
        </style>
        <ha-card>
          <div class="not-found">
            Entity not available: ${this._config.entity}
          </div>
        </ha-card>
      `;
    }

    return html`
      <ha-card>
        ${this._config.menu_type == "today" ? this.renderToday() : this.renderWeek()}
      </ha-card>
    `;
  }

  renderToday() {
    const stateObj = this.hass.states[this._config.entity];
    return html`
      <div class="title">${stateObj.attributes.friendly_name} Meny Idag</div>
      `;
  }
  
  getWeekCalendar() {
    const stateObj = this.hass.states[this._config.entity];
    const calendar = stateObj.attributes.calendar;
    
    let date = new Date();

    let weekDay = (new Date()).getDay(); // 0-6, Sunday = 0
    if (weekDay == 6) // saturday
      date.setDate(date.getDate() + 2)
    else if (weekDay == 0)
      date.setDate(date.getDate() + 1)

    let week = date.getWeek(); // week starts on monday

    if (!calendar.hasOwnProperty(week))
      throw new Error (`${this._config.entity} attribute calendar has no week ${week}`)
    
    return {
      'week': week, 
      'days':calendar[week]
    };
  }

  renderWeek() {
    const stateObj = this.hass.states[this._config.entity];
    const calendar = this.getWeekCalendar()
    return html`
        <div class="title">${stateObj.attributes.friendly_name} Meny v${calendar.week}</div>
        ${calendar.days.map(function(day) {
          return html`<div class="day">
            <div class="dayname">${day.weekday}</div>
            ${day.courses.map(function(course){
              return html`<div class="course">${course}</div>`;
            })}
          </div>`;
        })}
      `;
    }

  getCardSize() {
    return 3;
  }

  static get styles() {
    return css`
      ha-card {
        cursor: pointer;
        overflow: hidden;
        margin: 0;
        padding: 20px 10px;
        height: 100%;
        position: relative;
        display: block;
        box-sizing: border-box;
      }
      div.title {
        font-family: 'Mea Culpa';
        font-size: 2em;
        text-align: center;
        font-size: 2em;
        padding-top: 25px;
        padding-bottom:15px; 
      }
      div.title:first-child {
        padding-top: 0;
      }

      div.day {
        text-align: center;
        margin-top: 10px
      }
      div.day div.dayname {
        font-weight: bold;
      }
      div.day div.course {
        font-style: italic;
        font-size: 0.9em;
        line-height: 1.3em
      }

    `;
  }
}
customElements.define("skolmat-card", SkolmatCard);
