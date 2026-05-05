import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("renders the panel with the live iframe and both toggle buttons by default", () => {
    render(<Home />);
    expect(screen.getByText("Jackpota mobile preview")).toBeInTheDocument();
    expect(screen.getAllByTitle("Jackpota mobile preview frame")[0]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Logged Out" })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Logged In" })[0]).toBeInTheDocument();
    expect(screen.getAllByText("Feature toggles")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Jackpot widget")[0]).toBeInTheDocument();
  });

  it("switches to the jackpot widget when the feature toggle is turned on", () => {
    render(<Home />);
    fireEvent.click(screen.getAllByRole("switch", { name: "" })[0]);
    // Section header updates
    expect(screen.getAllByText("Jackpot widget prototype")[0]).toBeInTheDocument();
    // Widget live iframe is embedded inside JackpotWidget
    expect(screen.getAllByTitle("Jackpota live preview")[0]).toBeInTheDocument();
    // Big Jackpot counter pill is visible
    expect(screen.getAllByText(/Big Jackpot/i)[0]).toBeInTheDocument();
  });

  it("switches the label to logged in on the live iframe view", () => {
    render(<Home />);
    fireEvent.click(screen.getAllByRole("button", { name: "Logged In" })[0]);
    expect(screen.getAllByTitle("Jackpota mobile preview frame")[0]).toBeInTheDocument();
    expect(screen.getAllByText(/logged in/i)[0]).toBeInTheDocument();
  });
});
