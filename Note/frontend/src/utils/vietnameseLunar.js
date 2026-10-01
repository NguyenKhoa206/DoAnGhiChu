const TIME_ZONE = 7;
const PI = Math.PI;
const RAD = PI / 180;

const julianDayFromDate = (day, month, year) => {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  let julianDay = day + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (julianDay < 2299161) {
    julianDay = day + Math.floor((153 * m + 2) / 5) + 365 * y
      + Math.floor(y / 4) - 32083;
  }
  return julianDay;
};

const newMoon = (k) => {
  const t = k / 1236.85;
  const t2 = t * t;
  const t3 = t2 * t;
  const jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3
    + 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * RAD);
  const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
  const mPrime = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
  const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;
  let correction = (0.1734 - 0.000393 * t) * Math.sin(m * RAD) + 0.0021 * Math.sin(2 * m * RAD);
  correction -= 0.4068 * Math.sin(mPrime * RAD);
  correction += 0.0161 * Math.sin(2 * mPrime * RAD);
  correction -= 0.0004 * Math.sin(3 * mPrime * RAD);
  correction += 0.0104 * Math.sin(2 * f * RAD) - 0.0051 * Math.sin((m + mPrime) * RAD);
  correction -= 0.0074 * Math.sin((m - mPrime) * RAD);
  correction += 0.0004 * Math.sin((2 * f + m) * RAD);
  correction -= 0.0004 * Math.sin((2 * f - m) * RAD) + 0.0006 * Math.sin((2 * f + mPrime) * RAD);
  correction += 0.0010 * Math.sin((2 * f - mPrime) * RAD) + 0.0005 * Math.sin((2 * mPrime + m) * RAD);

  let deltaT;
  if (t < -11) {
    deltaT = 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3;
  } else {
    deltaT = -0.000278 + 0.000265 * t + 0.000262 * t2;
  }
  return jd1 + correction - deltaT;
};

const newMoonDay = (k) => Math.floor(newMoon(k) + 0.5 + (TIME_ZONE / 24));

const sunLongitudeSector = (julianDay) => {
  const t = (julianDay - 2451545.5 - TIME_ZONE / 24) / 36525;
  const t2 = t * t;
  const m = 357.52910 + 35999.05030 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
  const l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
  const dl = (1.914600 - 0.004817 * t - 0.000014 * t2) * Math.sin(m * RAD)
    + (0.019993 - 0.000101 * t) * Math.sin(2 * m * RAD)
    + 0.000290 * Math.sin(3 * m * RAD);
  let longitude = (l0 + dl) * RAD;
  longitude -= 2 * PI * Math.floor(longitude / (2 * PI));
  return Math.floor(longitude / PI * 6);
};

const lunarMonth11 = (year) => {
  const offset = julianDayFromDate(31, 12, year) - 2415021;
  const k = Math.floor(offset / 29.530588853);
  let day = newMoonDay(k);
  if (sunLongitudeSector(day) >= 9) day = newMoonDay(k - 1);
  return day;
};

const leapMonthOffset = (month11) => {
  const k = Math.floor(0.5 + (month11 - 2415021) / 29.530588853);
  let lastSector = 0;
  let i = 1;
  let sector = sunLongitudeSector(newMoonDay(k + i));
  do {
    lastSector = sector;
    i += 1;
    sector = sunLongitudeSector(newMoonDay(k + i));
  } while (sector !== lastSector && i < 14);
  return i - 1;
};

export const solarToVietnameseLunar = (date) => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const dayNumber = julianDayFromDate(day, month, year);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = newMoonDay(k + 1);
  if (monthStart > dayNumber) monthStart = newMoonDay(k);

  let month11 = lunarMonth11(year);
  let nextMonth11 = month11;
  let lunarYear;
  if (month11 >= monthStart) {
    lunarYear = year;
    month11 = lunarMonth11(year - 1);
  } else {
    lunarYear = year + 1;
    nextMonth11 = lunarMonth11(year + 1);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - month11) / 29);
  let lunarMonth = diff + 11;
  let isLeapMonth = false;
  if (nextMonth11 - month11 > 365) {
    const leapOffset = leapMonthOffset(month11);
    if (diff >= leapOffset) {
      lunarMonth = diff + 10;
      if (diff === leapOffset) isLeapMonth = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeapMonth };
};
