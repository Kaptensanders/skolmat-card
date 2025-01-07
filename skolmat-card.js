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
  }

  setConfig(conf) {

    let config = {...conf}
    if (!config.entity)
      throw new Error("Please define a skolmat entity");
    
    config.menu_type = config.menu_type ? config.menu_type : "week";
    if (config.menu_type != "today" && config.menu_type != "week" && config.menu_type != "rolling-week")
      throw new Error("Options for 'menu_type' config parameter must be today, week or rolling-week. Got: " + config.menu_type);
        
    config.header = config.header ? config.header : "full";
    if (config.header != "none" && config.header != "short" && config.header != "full" && config.header != "school-name")
        throw new Error("Options for 'header' config parameter must be full, short, school-name, or none. Got: " + config.header);

    config.rolling_week_max_days = config.rolling_week_max_days ? config.rolling_week_max_days : 5;
    if (!Number.isInteger(config.rolling_week_max_days) || config.rolling_week_max_days < 1 || config.rolling_week_max_days > 10)
        throw new Error("Options for 'rolling_week_max_days' config parameter must be an integer between 1 and 10. Got: " + config.rolling_week_max_days);


    config.show_dates = config.show_dates ? true : false;

    if (!config.header_font) {
      config.header_font = "https://fonts.googleapis.com/css?family=Mea Culpa";
      config.header_fontsize = "2em";
    }
    if (config.header_font != "none") {
      let queryString = config.header_font.substring(config.header_font.indexOf('?') + 1);
      const urlParams = new URLSearchParams(queryString);
      if (!urlParams.has("family"))
          throw new Error("header_font url needs to contain the 'family' query string parameter, providing the ccs font-family attribute"); 
      config.header_fontname = urlParams.get("family")

      const fontEl = document.createElement('link');
      fontEl.rel = 'stylesheet';
      fontEl.href = config.header_font
      document.head.appendChild(fontEl);
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

    if (this._config.menu_type == "today")
      return html`<ha-card><div class="menu today">${this.renderToday()}</div></ha-card>`
    else
      return html`<ha-card><div class="menu week">${this.renderWeek()}</div></ha-card>`
  }

  getHeader (timePeriod) {

    let style = '';
    if (this._config.header_font != "none")
      style += "font-family:" + this._config.header_fontname + ";";
    if (this._config.header_fontsize)
      style += "font-size:" + this._config.header_fontsize + ";";

    const stateObj = this.hass.states[this._config.entity];
    if (this._config.header == "none" )
      return ''
    else {
      let header = this._config.menu_type == "today" ? timePeriod : 'Meny ' + timePeriod
      if (this._config.header == "short" )
        return html`<div class="title" style="${style}">${header}</div>`
      if (this._config.header == "school-name" )
        return html`<div class="title" style="${style}">${stateObj.attributes.friendly_name}</div>`
      else
        return html`<div class="title" style="${style}">${stateObj.attributes.friendly_name} ${header}</div>`
    }

  } 
  renderToday() {

    const stateObj = this.hass.states[this._config.entity];
    let weekNo = this.getWeek(); // week starts on monday
    let today = "Idag"
    let menu = "Idag serveras ingen mat";

    try {

      let week = this.getWeekCalendar(weekNo);
      let todayDate = new Date()
      todayDate.setUTCHours(0, 0, 0, 0);
      
      for (const day of week.days){
        let date = new Date(day.date)
        date.setUTCHours(0, 0, 0, 0);
        if (date.getTime() === todayDate.getTime()) {
          today = `${day.weekday} v${day.week}`;
          menu = day.courses.map(function(course){
            return html`<div class="course">${course}</div>`;
          })
        }
      }
      return html`
        ${this.getHeader(today)}
        <div class="day">
          <div class="course">${menu}</div>
        </div>
        `;
    }
    catch (err) {
      console.error(err);
      return html`
          ${this.getHeader(today)}
          <div class="day">
            <div class="course">Det finns ingen meny för vecka ${weekNo}</div>
          </div>`
    }
  }

  renderWeek() {
    
    const stateObj = this.hass.states[this._config.entity];
    let week = this.getWeek();

    try {
      const calendar = this.getWeekCalendar(week)
      return html`

          ${this.getHeader(this._config.menu_type == "rolling-week" ? "" : 'v'+ week)}
          ${calendar.days.map((day) => {
            
            let dateStr = ""
            if (this._config.show_dates || this._config.menu_type == "rolling-week") {

              let date = new Date(day.date);
              dateStr = ` - ${date.getDate()}/${date.getMonth() + 1}`
            }

            return html`<div class="day">
              <div class="dayname">${day.weekday}${dateStr}</div>
              ${day.courses.map(function(course){
                return html`<div class="course">${course}</div>`;
              })}
            </div>`;
          })}`;
    }
    catch (err) {
      console.error(err);
      return html`
          ${this.getHeader('v'+ week)}
          <div class="day">
            <div class="course">Det finns ingen meny för vecka ${week}</div>
          </div>`
    }
  }

  getCardSize() {
    return 3;
  }

  getWeek() {

    let date = new Date();

    let weekDay = (new Date()).getDay(); // 0-6, Sunday = 0
    if (weekDay == 6) // saturday
      date.setDate(date.getDate() + 2)
    else if (weekDay == 0)
      date.setDate(date.getDate() + 1)

    return date.getWeek(); // week starts on monday
  }

  getWeekCalendar(week) {
    const stateObj = this.hass.states[this._config.entity];
    const calendar = stateObj.attributes.calendar;

    if (!calendar)
      throw new Error (`${this._config.entity} attributes does not contain a calendar`)

    if (!calendar.hasOwnProperty(week))
      throw new Error (`${this._config.entity} calendar has no week ${week}`)

    let days = calendar[week]
    if (this._config.menu_type == "rolling-week") {

      const today = new Date()
      today.setHours(0, 0, 0, 0);

      const allDays = Object.values(calendar).flat();

      // Filter items with dates today or later
      const futureDays = allDays.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= today;
      });
    
      days = futureDays.slice(0, this._config.rolling_week_max_days);
    }


    return {
      'week': week, 
      'days': days
    };
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
        text-align: center;
        padding-top: 25px;
        padding-bottom:15px; 
        font-size: 1.5em
      }
      div.title:first-child {
        padding-top: 0;
      }

      div.day {
        text-align: center;        
      }
      
      div.day:nth-child(n+2) { margin-top: 10px }
      div.menu.today div.day { margin-top: 0 }

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
