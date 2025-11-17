

## 1. Цель сервиса

Создать модульный веб-сервис (HTML + CSS + JS), который позволяет предпринимателю:

1. Посчитать юнит-экономику товара/услуги/бизнеса.
2. Учесть:

   * разные системы налогообложения, в т.ч. **УСН с НДС**, **автоматический УСН (АУСН)**, патент и др.;
   * варианты НДС: 0%, 5%/7% без вычетов, 10%, 20%/22% с вычетами; ([kontur-extern.ru][2])
   * изменения с 2026 года (пониженные лимиты для НДС и спецрежимов, рост ставки до 22% и т.п.); ([Т-Бизнес секреты][1])
3. Вести **постатейный учёт** переменных и постоянных расходов (каждая статья: своя сумма и свой %).
4. Делать сценарный анализ цены (скидки/наценки).
5. Иметь отдельную вкладку для **гибкой настройки налоговых режимов** (ставки, лимиты, НДС, стоимость патента и т.д.).

---

## 2. Налоговые режимы, которые должен поддерживать сервис

### 2.1. Базовые режимы

Как минимум, в пресетах по умолчанию:

1. **УСН (доходы) без НДС**
2. **УСН (доходы – расходы) без НДС**
3. **УСН (доходы) с НДС**
4. **УСН (доходы – расходы) с НДС**
5. **АУСН (автоматический УСН)**:

   * объект «Доходы» – ставка 8% от доходов; ([ausn.nalog.gov.ru][3])
   * объект «Доходы минус расходы» – ставка 20% + минимальный налог 3% от доходов (как описывают многие разборы). ([Т-Бизнес секреты][4])
6. **Патент (ПСН)**:

   * налог = стоимость патента за период (из настроек);
   * лимит дохода по ПСН (по умолчанию 60 млн, с возможностью указать снижение до 10/20 млн в зависимости от окончательной версии закона). ([pravo.tech][5])
7. При необходимости — **ОСНО (общая система)** для сравнения:

   * налог на прибыль или НДФЛ + НДС (с вычетами).

### 2.2. НДС и его варианты

Для каждого режима можно задать:

* `vatEnabled` — включён ли НДС.
* `vatMode`:

  * `"none"` — без НДС;
  * `"noInputDeduction"` — НДС по сниженной ставке (5% / 7%) без права вычета (просто надбавка к налоговой нагрузке на выручку); ([allo.tochka.com][6])
  * `"withInputDeduction"` — классический НДС (10% или 20/22% с правом вычета входного налога). ([kontur-extern.ru][7])
* `vatRateOutput` — ставка НДС при продаже (например, 5, 7, 10, 20, 22).
* `vatRateInputDefault` — средняя доля входного НДС от расходов (можно задавать руками или через настройки).

Лимиты для НДС (например, `annualTurnoverPrevYearForVat`, `currentYearVatThreshold`) задаются в конфиге и зависят от окончательной редакции реформы (10/20 млн+).([Т-Бизнес секреты][1])

### 2.3. Особенности АУСН

Модуль АУСН должен учитывать:

* ставки: 8% и 20% в зависимости от объекта; ([ausn.nalog.gov.ru][3])
* то, что страховые взносы в значительной части «зашиты» в сам режим (их можно не учитывать отдельно как фиксированные взносы, либо учитывать доп. вручную отдельной статьёй расходов по желанию пользователя); ([1cbo.ru][8])
* ограничения по обороту, численности и т.п. задаются параметрами режима (для расчётов юнит-экономики достаточно флага «превышен/не превышен лимит»).

---

## 3. Входные данные (форма) с учётом постатейных расходов

### 3.1. Общие параметры

1. **Режим расчёта**:

   * Услуги
   * Товары
   * По обороту

2. **Налоговый режим** (select) — берётся из пресетов (см. выше).

3. **План продаж**:

   * `plannedQuantity` — количество единиц за период
   * либо `plannedRevenueTotal` — оборот за период (для режима «по обороту»).

4. **Цена / средний чек**:

   * `pricePerUnit`
   * флаг, включает ли цена НДС (`priceIncludesVat`) — чтобы корректно делить на (1+НДС).

### 3.2. Постатейные переменные расходы

Переменные расходы вводятся **списком статей**, каждая статья — отдельная строка:

Поля статьи:

* `id` — внутренний идентификатор.
* `name` — название (например, «Себестоимость товара», «Комиссия маркетплейса», «Расходники»).
* `valueFixedPerUnit` — твёрдая сумма на одну единицу (руб/шт).
* `valuePercentPerUnitRevenue` — % от выручки на единицу (от цены без НДС или с НДС — задаётся в настройках, по умолчанию от цены с НДС).
* опционально: `category` (например, «логистика», «производство», «платформа»).

Расчёт по статье:

```text
revenueBasePerUnit = (priceIncludesVat && vatEnabled && vatMode == 'withInputDeduction')
    ? pricePerUnit / (1 + vatRateOutput)
    : pricePerUnit

variableCostPerUnit_i = valueFixedPerUnit
                       + revenueBasePerUnit * valuePercentPerUnitRevenue / 100

variableCostTotal_i = variableCostPerUnit_i * plannedQuantity
```

Итого:

```text
variableCostPerUnitTotal = Σ variableCostPerUnit_i
variableCostTotal = Σ variableCostTotal_i
```

### 3.3. Постатейные постоянные расходы

Аналогично — список статей:

Поля статьи:

* `id`
* `name` — (аренда, зарплата администратора, реклама, интернет и т.п.)
* `valueFixedPerPeriod` — фиксированная сумма за период (мес/квартал — задаётся в настройках).
* `valuePercentOfRevenueTotal` — % от общей выручки (например, комиссионные, которые считаются как «условно постоянные» от оборота).

Расчёт по статье:

```text
fixedCostTotal_i = valueFixedPerPeriod
                  + revenueTotal * valuePercentOfRevenueTotal / 100
```

Итого:

```text
fixedCostTotal = Σ fixedCostTotal_i
```

---

## 4. Расчётная логика (обновлённая)

### 4.1. Базовые величины

1. **Выручка за период**:

* если вводим количество и цену:

```text
revenueTotal = pricePerUnit * plannedQuantity
```

* если режим «по обороту»:

```text
revenueTotal = plannedRevenueTotal
```

2. **Выручка без НДС** (если НДС с вычетами и цена с НДС):

```text
if vatEnabled && vatMode == 'withInputDeduction' && priceIncludesVat:
    revenueNetOfVat = revenueTotal / (1 + vatRateOutput)
else:
    revenueNetOfVat = revenueTotal
```

3. **Переменные расходы** — см. выше.

4. **Постоянные расходы** — см. выше.

### 4.2. Прибыль до налога

```text
grossProfit = revenueTotal - variableCostTotal
profitBeforeTax = grossProfit - fixedCostTotal
```

*(опционально можно считать «операционную прибыль до НДС», если надо отдельно показать налоговую часть)*

### 4.3. НДС

Общий подход:

* Для `vatMode == 'noInputDeduction'`:

```text
outputVat = revenueTotal * vatRateOutput / 100
inputVat = 0
vatToPay = outputVat
```

* Для `vatMode == 'withInputDeduction'`:

  * НДС с продаж:

  ```text
  outputVat = revenueTotal * vatRateOutput / (100 + vatRateOutput)
  ```

  * Входной НДС:

  * Либо вводится пользователем отдельно,

  * Либо оценивается как доля от НДС в расходах: `inputVat ≈ variableCostTotal * avgInputVatShare + fixedCostTotal * avgInputVatShareFixed`.

  Итого:

  ```text
  vatToPay = max(outputVat - inputVat, 0)
  ```

### 4.4. Основной налог по режиму

Модуль **`taxEngine`**:

```ts
calculateTax({
  revenueTotal,
  revenueNetOfVat,
  profitBeforeTax,
  variableCostTotal,
  fixedCostTotal,
  taxModeConfig,
  vatToPay
}) => {
  return {
    taxBusiness: number,   // основной налог (УСН / АУСН / ПСН / налог на прибыль и т.п.)
    vatToPay: number,
    totalTax: number,
    details: {...}
  }
}
```

Примеры:

* **УСН «Доходы»**: `taxBusiness = revenueNetOfVat * taxRate`
* **УСН «Доходы – расходы»**:
  `taxBase = max(profitBeforeTax, 0)`
  `taxBusiness = max(taxBase * taxRate, minTaxFromRevenue)` (минимальный налог можно задать в конфиге).
* **АУСН «Доходы»**: `taxBusiness = revenueTotal * 8%` (ставка в конфиге). ([ausn.nalog.gov.ru][3])
* **АУСН «Доходы – расходы»**: `taxBusiness = max(profitBeforeTax * 20%, 3% от дохода)` — параметры в конфиге. ([Т-Бизнес секреты][4])
* **ПСН**: `taxBusiness = patentCostForPeriod` (из настроек).

Финально:

```text
netProfitTotal = profitBeforeTax - taxBusiness - vatToPay
netProfitPerUnit = netProfitTotal / plannedQuantity
```

**Ключевые показатели:**

* `revenuePerUnit`
* `variableCostPerUnitTotal`
* `fixedCostPerUnit` = `fixedCostTotal / plannedQuantity`
* `taxPerUnit` = `totalTax / plannedQuantity`
* `netProfitPerUnit`
* маржа, точка безубыточности, ROI и т.д.

---

## 5. Модуль сценариев по цене (с учётом новой логики)

Вход:

* `basePricePerUnit`
* шаг изменения:

  * `stepType`: `%` или `руб`
  * `stepValue`
* количество шагов вверх/вниз.

Алгоритм:

1. Для каждого сценария пересчитать:

   * цену,
   * выручку,
   * переменные/постоянные (они зависят от цены и выручки через проценты по статьям),
   * налог (через `taxEngine`).
2. Количество единиц на первом шаге можно считать неизменным (потом добавишь эластичность).
3. Вывод:

   * таблица: Цена, Выручка, Чистая прибыль, ЧП/ед., разница к базовой.

---

## 6. Структура данных (обновлённая)

### 6.1. Сущности

```ts
type TaxMode = {
  id: string;
  name: string; // "УСН доходы", "АУСН доходы", "Патент" и т.д.
  baseType: 'USN' | 'AUSN' | 'PATENT' | 'OSNO' | 'OTHER';
  incomeBase: 'REVENUE' | 'PROFIT' | 'FIXED';
  taxRate: number; // в %
  minTaxRateFromRevenue?: number; // для УСН/АУСН доходы-расходы
  vatEnabled: boolean;
  vatMode: 'none' | 'noInputDeduction' | 'withInputDeduction';
  vatRateOutput?: number;
  avgInputVatShareVariable?: number;
  avgInputVatShareFixed?: number;
  turnoverLimit?: number;
  patentCostPerPeriod?: number;
  notes?: string;
};
```

```ts
type ExpenseItemVariable = {
  id: string;
  name: string;
  valueFixedPerUnit: number;
  valuePercentPerUnitRevenue: number;
  category?: string;
};

type ExpenseItemFixed = {
  id: string;
  name: string;
  valueFixedPerPeriod: number;
  valuePercentOfRevenueTotal: number;
  category?: string;
};

type UnitEconomicsInput = {
  mode: 'SERVICE' | 'PRODUCT' | 'TURNOVER';
  taxModeId: string;
  plannedQuantity?: number;
  plannedRevenueTotal?: number;
  pricePerUnit: number;
  priceIncludesVat: boolean;
  variableExpenses: ExpenseItemVariable[];
  fixedExpenses: ExpenseItemFixed[];
};
```

---

## 7. Архитектура фронта и файлы (с учётом новых требований)

Структура проекта остаётся модульной, но уточним, что у налогов и расходов есть свои слои:

```text
project-root/
├── index.html
├── assets/
│   ├── css/
│   │   ├── base.css
│   │   ├── layout.css
│   │   └── components.css
│   └── js/
│       ├── main.js
│       ├── config/
│       │   ├── taxPresets.default.json    # пресеты режимов
│       │   └── appConfig.js               # период расчёта, дефолт НДС и т.п.
│       ├── core/
│       │   ├── state.js                   # глобальное состояние (input/output)
│       │   ├── eventBus.js
│       │   ├── taxEngine.js               # ВСЯ налоговая логика
│       │   ├── expensesEngine.js          # расчёт постатейных расходов
│       │   ├── validation.js
│       │   └── utils.js
│       └── modules/
│           ├── unitEconomics/
│           │   ├── unitEconomics.model.js
│           │   ├── unitEconomics.view.js
│           │   └── unitEconomics.controller.js
│           ├── priceScenario/
│           │   ├── priceScenario.model.js
│           │   ├── priceScenario.view.js
│           │   └── priceScenario.controller.js
│           └── taxSettings/
│               ├── taxSettings.model.js
│               ├── taxSettings.view.js
│               └── taxSettings.controller.js
└── README.md
```

**Новые моменты:**

* `expensesEngine.js`:

  * функции `calculateVariableExpenses(input)`, `calculateFixedExpenses(input)`, работают с массивами статей;
* `taxEngine.js`:

  * работает только с агрегированными суммами и `TaxMode` из `state/config`;
  * легко расширяется под новые режимы/ставки.

