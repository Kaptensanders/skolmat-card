const LitElement = window.LitElement || Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const html = window.html || LitElement.prototype.html;
const css = window.css || LitElement.prototype.css;

window.customCards = window.customCards || [];
window.customCards.push({
  type: "skolmat-card",
  name: "Skolmat card",
  description: "Card to display the food menu in swedish schools. Relies on the skolmat integration",
  preview: false,
  documentationURL: "https://github.com/Kaptensanders/skolmat-card",
});

if (!window.__skolmatCardBadgeShown) {
  window.__skolmatCardBadgeShown = true;
  console.info(
    "%c SKOLMAT-CARD 2.0.0%c Loaded",
    "background:#111827;color:#fff;padding:2px 6px;border-radius:2px 0 0 2px;font-weight:600;",
    "background:#e5e7eb;color:#111827;padding:2px 6px;border-radius:0 2px 2px 0;"
  );
}

function hasConfigOrEntityChanged(element, changedProps) {
  if (changedProps.has("_config")) {
    return true;
  }

  const oldHass = changedProps.get("hass");
  if (oldHass) {
    return oldHass.states[element._config.entity] !== element.hass.states[element._config.entity];
  }

  return true;
}

function startOfIsoWeek(date) {
  const d = new Date(date.getTime());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getIsoWeekNumber(date) {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
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
    this._logKey = "skolmat-card";
    this._handleMoreInfo = this._handleMoreInfo.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this._handleMoreInfo);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this._handleMoreInfo);
    super.disconnectedCallback();
  }

  setConfig(conf) {
    let config = { ...conf };

    if (!config.entity) {
      throw new Error("Please define a skolmat entity");
    }

    config.menu_type = config.menu_type ? config.menu_type : "week";

    // Normalize string inputs from decluttering-card templates.
    if (typeof config.show_dates === "string") {
      const showDatesValue = config.show_dates.trim().toLowerCase();
      config.show_dates = showDatesValue === "true";
    }
    if (typeof config.rolling_week_max_days === "string") {
      const rollingValue = config.rolling_week_max_days.trim().toLowerCase();
      if (!rollingValue || rollingValue === "null") {
        config.rolling_week_max_days = undefined;
      } else {
        const parsed = Number(rollingValue);
        config.rolling_week_max_days = Number.isFinite(parsed) ? parsed : config.rolling_week_max_days;
      }
    }
    if (typeof config.header_font === "string") {
      const fontValue = config.header_font.trim().toLowerCase();
      if (!fontValue || fontValue === "null" || fontValue.includes("[[")) {
        config.header_font = undefined;
      }
    }
    if (typeof config.header_fontsize === "string") {
      const sizeValue = config.header_fontsize.trim().toLowerCase();
      if (!sizeValue || sizeValue === "null" || sizeValue.includes("[[")) {
        config.header_fontsize = undefined;
      }
    }
    if (config.menu_type !== "today" && config.menu_type !== "week" && config.menu_type !== "rolling-week") {
      throw new Error("Options for 'menu_type' config parameter must be today, week or rolling-week. Got: " + config.menu_type);
    }

    config.header = config.header ? config.header : "full";
    if (config.header !== "none" && config.header !== "short" && config.header !== "full" && config.header !== "school-name") {
      throw new Error("Options for 'header' config parameter must be full, short, school-name, or none. Got: " + config.header);
    }

    config.rolling_week_max_days = config.rolling_week_max_days ? config.rolling_week_max_days : 5;
    if (!Number.isInteger(config.rolling_week_max_days) || config.rolling_week_max_days < 1 || config.rolling_week_max_days > 10) {
      throw new Error("Options for 'rolling_week_max_days' config parameter must be an integer between 1 and 10. Got: " + config.rolling_week_max_days);
    }

    config.show_dates = config.show_dates ? true : false;

    config.show_meals = config.show_meals ? config.show_meals : "if-multiple";
    if (config.show_meals !== "none" && config.show_meals !== "always" && config.show_meals !== "if-multiple") {
      throw new Error("Options for 'show_meals' config parameter must be none, always, or if-multiple. Got: " + config.show_meals);
    }

    config.show_dish_labels = config.show_dish_labels ? config.show_dish_labels : "if-multiple";
    if (config.show_dish_labels !== "none" && config.show_dish_labels !== "always" && config.show_dish_labels !== "if-multiple") {
      throw new Error("Options for 'show_dish_labels' config parameter must be none, always, or if-multiple. Got: " + config.show_dish_labels);
    }

    config.locale = config.locale ? config.locale : "default";
    if (config.locale !== "default" && config.locale !== "en" && config.locale !== "sv") {
      throw new Error("Options for 'locale' config parameter must be default, en, or sv. Got: " + config.locale);
    }

    if (!config.header_font) {
      config.header_font = "https://fonts.googleapis.com/css?family=Mea+Culpa";
      config.header_fontsize = "2em";
    }
    if (config.header_font !== "none") {
      let queryString = config.header_font.substring(config.header_font.indexOf("?") + 1);
      const urlParams = new URLSearchParams(queryString);
      if (!urlParams.has("family")) {
        throw new Error("header_font url needs to contain the 'family' query string parameter, providing the ccs font-family attribute");
      }
      config.header_fontname = urlParams.get("family");

      const fontEl = document.createElement("link");
      fontEl.rel = "stylesheet";
      fontEl.href = config.header_font;
      document.head.appendChild(fontEl);
    }

    this._config = config;
    this._logKey = `skolmat-card:${config.entity}`;
  }

  shouldUpdate(changedProps) {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  _debug(message, data) {
    console.debug(`[${this._logKey}] ${message}`, data || "");
  }

  _getLocale() {
    if (this._config?.locale && this._config.locale !== "default") {
      return this._config.locale;
    }
    return this.hass?.locale?.language || this.hass?.config?.language || navigator.language || "en";
  }

  _localizeCard(key) {
    const lang = (this._getLocale() || "en").toLowerCase();
    const language = lang.startsWith("sv") ? "sv" : "en";
    const strings = {
      en: {
        noMenu: "No menu available",
        cannotLoad: "Cannot load menu",
        menuWeek: "Menu",
        weekShort: "w",
        today: "Today",
      },
      sv: {
        noMenu: "Ingen meny tillgänglig",
        cannotLoad: "Kan inte ladda meny",
        menuWeek: "Meny",
        weekShort: "v",
        today: "Idag",
      },
    };
    return strings[language][key] || strings.en[key] || key;
  }

  _weekdayName(date) {
    const locale = this._getLocale();
    const name = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : name;
  }

  _weekHeader(weekNumber) {
    const menuWord = this._localizeCard("menuWeek");
    const weekPrefix = this._localizeCard("weekShort");
    return `${menuWord} ${weekPrefix}${weekNumber}`;
  }

  _todayHeaderLabel(date) {
    const weekNumber = getIsoWeekNumber(date);
    const weekPrefix = this._localizeCard("weekShort");
    const weekday = this._weekdayName(date);
    return `${weekday} ${weekPrefix}${weekNumber}`;
  }

  _getHeader(timePeriod) {
    let style = "";
    if (this._config.header_font !== "none") {
      style += "font-family:" + this._config.header_fontname + ";";
    }
    if (this._config.header_fontsize) {
      style += "font-size:" + this._config.header_fontsize + ";";
    }

    const stateObj = this.hass.states[this._config.entity];
    const friendlyName = stateObj?.attributes?.friendly_name || this._config.entity;

    if (this._config.header === "none") {
      return "";
    }

    if (this._config.header === "short") {
      return timePeriod ? html`<div class="title" style="${style}">${timePeriod}</div>` : "";
    }

    if (this._config.header === "school-name") {
      return html`<div class="title" style="${style}">${friendlyName}</div>`;
    }

    const headerText =
      timePeriod && this._config.menu_type === "today"
        ? `${friendlyName} - ${timePeriod}`
        : timePeriod
          ? `${friendlyName} ${timePeriod}`
          : `${friendlyName}`;
    return html`<div class="title" style="${style}">${headerText}</div>`;
  }

  render() {
    if (!this._config || !this.hass) {
      return html``;
    }

    const stateObj = this.hass.states[this._config.entity];

    if (!stateObj) {
      const message = this.hass.localize(
        "ui.panel.lovelace.card.entity_not_found",
        "entity",
        this._config.entity
      );
      return html`<hui-warning>${message}</hui-warning>`;
    }

    if (stateObj.state === "unavailable") {
      return html`
        <ha-card>
          <div class="menu week">${this._renderCannotLoad()}</div>
        </ha-card>
      `;
    }

    const calendar = stateObj.attributes?.calendar;
    if (!calendar || typeof calendar !== "object") {
      return html`
        <ha-card>
          <div class="menu week">${this._renderCannotLoad()}</div>
        </ha-card>
      `;
    }

    if (this._config.menu_type === "today") {
      return html`
        <ha-card>
          <div class="menu today">${this._renderToday(calendar)}</div>
        </ha-card>
      `;
    }

    return html`
      <ha-card>
        <div class="menu week">${this._renderWeek(calendar)}</div>
      </ha-card>
    `;
  }

  _handleMoreInfo() {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId: this._config.entity },
        bubbles: true,
        composed: true,
      })
    );
  }

  _renderCannotLoad() {
    const text = this._localizeCard("cannotLoad");

    let timePeriod = "";
    const now = new Date();
    if (this._config.menu_type === "week") {
      timePeriod = this._weekHeader(getIsoWeekNumber(now));
    } else if (this._config.menu_type === "today") {
      timePeriod = this._todayHeaderLabel(now);
    }

    return html`
      ${this._getHeader(timePeriod)}
      <div class="day">
        <div class="course">${text}</div>
      </div>
    `;
  }

  _renderToday(calendar) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = toIsoDate(today);
    const entries = calendar[todayIso] || [];

    const timePeriod = this._todayHeaderLabel(today);
    return html`
      ${this._getHeader(timePeriod)}
      ${this._renderDayBlock(today, entries, true)}
    `;
  }

  _renderWeek(calendar) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = startOfIsoWeek(today);
    const weekNumber = getIsoWeekNumber(today);

    const days = [];
    for (let i = 0; i < 5; i += 1) {
      const date = addDays(weekStart, i);
      days.push(date);
    }

    const saturday = addDays(weekStart, 5);
    const sunday = addDays(weekStart, 6);
    const saturdayIso = toIsoDate(saturday);
    const sundayIso = toIsoDate(sunday);

    if (Object.prototype.hasOwnProperty.call(calendar, saturdayIso)) {
      days.push(saturday);
    }
    if (Object.prototype.hasOwnProperty.call(calendar, sundayIso)) {
      days.push(sunday);
    }

    if (this._config.menu_type === "rolling-week") {
      days.length = 0;
      for (let i = 0; i < this._config.rolling_week_max_days; i += 1) {
        const date = addDays(today, i);
        const iso = toIsoDate(date);
        const entries = calendar[iso] || [];
        if (entries.length > 0) {
          days.push(date);
        }
      }
    }

    const timePeriod = this._config.menu_type === "rolling-week" ? "" : this._weekHeader(weekNumber);

    return html`
      ${this._getHeader(timePeriod)}
      ${days.map((date) => {
        const iso = toIsoDate(date);
        const entries = calendar[iso] || [];
        return this._renderDayBlock(date, entries, this._config.menu_type !== "rolling-week");
      })}
    `;
  }

  _renderDayBlock(date, entries, allowDateSuffix) {
    const weekday = this._weekdayName(date);
    let dateStr = "";
    if (this._config.show_dates || this._config.menu_type === "rolling-week") {
      dateStr = ` - ${date.getDate()}/${date.getMonth() + 1}`;
    }

    const header = allowDateSuffix ? `${weekday}${dateStr}` : `${weekday}${dateStr}`;
    const content = entries.length ? this._renderEntries(entries) : this._renderNoMenu();
    const showDayName = this._config.menu_type !== "today";

    return html`
      <div class="day">
        ${showDayName ? html`<div class="dayname">${header}</div>` : ""}
        ${content}
      </div>
    `;
  }

  _renderNoMenu() {
    const text = this._localizeCard("noMenu");
    return html`<div class="course no-menu">${text}</div>`;
  }

  _renderEntries(entries) {
    const mealGroups = new Map();
    entries.forEach((entry) => {
      const meal = entry.meal && entry.meal.trim() ? entry.meal.trim() : "";
      if (!mealGroups.has(meal)) {
        mealGroups.set(meal, []);
      }
      mealGroups.get(meal).push(entry);
    });

    const distinctMeals = [...mealGroups.keys()].filter((meal) => meal);
    const showMealHeaders =
      this._config.show_meals === "always" ||
      (this._config.show_meals === "if-multiple" && distinctMeals.length > 1);

    return html`${[...mealGroups.entries()].map(([meal, mealEntries]) => {
      const labelSet = new Set(
        mealEntries
          .map((entry) => (entry.label && entry.label.trim() ? entry.label.trim() : ""))
          .filter((label) => label)
      );

      const showLabels =
        this._config.show_dish_labels === "always" ||
        (this._config.show_dish_labels === "if-multiple" && labelSet.size > 1);

      return html`
        <div class="meal">
          ${meal && showMealHeaders ? html`<div class="meal-name">${meal}</div>` : ""}
          ${mealEntries.map((entry) => {
            const label = entry.label && entry.label.trim() ? entry.label.trim() : "";
            const labelText = label && showLabels ? html`<span class="dish-label">${label}: </span>` : "";
            return html`<div class="course">${labelText}${entry.dish}</div>`;
          })}
        </div>
      `;
    })}`;
  }

  getCardSize() {
    if (!this._config) {
      return 3;
    }

    if (this._config.menu_type === "today") {
      return 2;
    }

    if (this._config.menu_type === "rolling-week") {
      return Math.min(6, Math.max(3, this._config.rolling_week_max_days));
    }

    return 5;
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
        padding-bottom: 15px;
        font-size: 1.5em;
      }
      div.title:first-child {
        padding-top: 0;
      }

      div.day {
        text-align: center;
      }

      div.day:nth-child(n + 2) {
        margin-top: 10px;
      }
      div.menu.today div.day {
        margin-top: 0;
      }

      div.day div.dayname {
        font-weight: bold;
      }
      div.day div.course {
        font-style: italic;
        font-size: 0.9em;
        line-height: 1.3em;
      }

      .today div.meal-name {
        font-weight: bold;
        margin-top: 6px;
      }

      .menu.week div.meal-name, .menu.rolling-week div.meal-name {
        font-style: italic;
        font-size: 0.9em;
        margin-top: 6px;
      }

      .menu.week div.meal-name::before,
      .menu.rolling-week div.meal-name::before {
        content: "- ";
      }

      .menu.week div.meal-name::after,
      .menu.rolling-week div.meal-name::after {
        content: " -";
      }

      span.dish-label {
      }
    `;
  }
}
customElements.define("skolmat-card", SkolmatCard);
