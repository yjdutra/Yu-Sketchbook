// As datas do YAML viram meia-noite UTC do dia 1. Num fuso negativo (o do Yuri, o de quem builda
// no Brasil), formatar no fuso local mostraria o mês anterior: "Dec 2014" em vez de "Jan 2015".
// O vitest.config.ts fixa TZ=America/Sao_Paulo; o primeiro teste garante que isso pegou.
import { describe, expect, it } from "vitest";
import { formatMonthYear, formatPeriod } from "@/lib/dates";

const jan2015 = new Date("2015-01-01"); // como o z.coerce.date() lê "2015-01-01" do YAML

describe("formatMonthYear", () => {
  it("roda num fuso negativo (pré-condição do teste)", () => {
    expect(process.env.TZ).toBe("America/Sao_Paulo");
    expect(jan2015.getTimezoneOffset()).toBeGreaterThan(0);
    // Prova de que o fuso local de fato mudaria o mês, se o módulo o usasse.
    expect(jan2015.getMonth()).toBe(11);
  });

  it("EN: Jan 2015, não Dec 2014", () => {
    expect(formatMonthYear(jan2015, "en")).toBe("Jan 2015");
  });

  it("PT: jan. de 2015, não dez. de 2014", () => {
    expect(formatMonthYear(jan2015, "pt")).toBe("jan. de 2015");
  });

  it("vale também para Date com hora UTC 00:00 no meio do ano", () => {
    expect(formatMonthYear(new Date("2021-10-01"), "en")).toBe("Oct 2021");
  });
});

describe("formatPeriod", () => {
  it("período fechado", () => {
    expect(formatPeriod(new Date("2021-10-01"), new Date("2022-10-01"), "en", "Present")).toBe(
      "Oct 2021 – Oct 2022",
    );
  });

  it("período aberto usa o rótulo do chamador", () => {
    expect(formatPeriod(new Date("2024-09-01"), undefined, "pt", "Atual")).toBe(
      "set. de 2024 – Atual",
    );
  });
});
