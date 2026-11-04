import { expect, test } from "@playwright/test";
import { acceptNextDialog, signedInPage } from "./helpers";

test("full game flow: sign-ups, waiting list, promotion, guests, admin and bans", async ({
  browser,
}) => {
  // Admin creates a 2-player game.
  const admin = await signedInPage(browser, "Admin");
  await admin.getByRole("link", { name: "Admin" }).click();
  await admin.getByRole("link", { name: "Nouveau match" }).click();
  await admin.getByLabel("Lieu").fill("City stade Belleville");
  await admin.getByLabel(/Date et heure/).fill("2030-06-02T10:00");
  await admin.getByLabel("Nombre de joueurs").fill("2");
  await admin.getByRole("button", { name: "Créer le match" }).click();
  await admin.waitForURL(/\/admin\/matchs\/[0-9a-f-]{36}$/);
  const gameUrl = admin.url().replace("/admin", "");

  // Two players fill the game, the third goes to the waiting list.
  const ali = await signedInPage(browser, "Ali");
  await ali.goto(gameUrl);
  await ali.getByRole("button", { name: "Je viens !" }).click();
  await expect(ali.getByText("Tu es inscrit")).toBeVisible();

  const bilal = await signedInPage(browser, "Bilal");
  await bilal.goto(gameUrl);
  await bilal.getByRole("button", { name: "Je viens !" }).click();
  await expect(bilal.getByText("Tu es inscrit")).toBeVisible();

  const chafik = await signedInPage(browser, "Chafik");
  await chafik.goto(gameUrl);
  await expect(chafik.getByText("Complet")).toBeVisible();
  await chafik.getByRole("button", { name: "Rejoindre la liste d'attente" }).click();
  await expect(chafik.getByText("Tu es n°1 sur la liste d'attente.")).toBeVisible();

  // A guest counts toward the limit, so Bilal's guest is also waitlisted.
  await bilal.getByLabel("Nom de ton invité").fill("Karim");
  await bilal.getByRole("button", { name: "Ajouter un invité" }).click();
  await expect(bilal.getByText("Liste d'attente (2)")).toBeVisible();

  // Ali leaves: Chafik (first in line) is promoted, pending confirmation.
  acceptNextDialog(ali);
  await ali.getByRole("button", { name: "Je me retire" }).click();
  // Chafik takes the freed spot, so the game is full again for Ali.
  await expect(ali.getByRole("button", { name: "Rejoindre la liste d'attente" })).toBeVisible();

  await chafik.reload();
  await expect(chafik.getByText("Une place s'est libérée pour toi !")).toBeVisible();
  await chafik.getByRole("button", { name: "Confirmer ma place" }).click();
  await expect(chafik.getByText("Tu es inscrit")).toBeVisible();

  // Admin removes Bilal (Karim the guest moves up) and adds Ali back (waitlisted).
  await admin.reload();
  const bilalRow = admin
    .getByTestId("entry")
    .filter({ has: admin.getByText("Bilal", { exact: true }) });
  acceptNextDialog(admin);
  await bilalRow.getByRole("button", { name: "Retirer" }).click();
  await expect(admin.getByText("Karim")).toBeVisible();
  await expect(admin.getByText("Joueurs (2/2)")).toBeVisible();

  await admin.getByLabel("Joueur à ajouter").selectOption({ label: "Ali" });
  await admin.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(admin.getByText("Liste d'attente (1)")).toBeVisible();

  // Admin bans Chafik: he leaves the game and can no longer sign in.
  await admin.goto("/admin/joueurs");
  const chafikRow = admin.getByTestId("player").filter({ hasText: "Chafik" });
  await chafikRow.getByLabel(/Raison/).fill("Absences répétées");
  await chafikRow.getByRole("button", { name: "Bannir" }).click();
  await expect(chafikRow.getByText("Banni", { exact: true })).toBeVisible();

  await chafik.goto("/moi");
  await expect(chafik).toHaveURL(/\/connexion/);
  await chafik.getByLabel("Nom de test").fill("Chafik");
  await chafik.getByRole("button", { name: "Connexion de test" }).click();
  await expect(chafik.getByText(/suspendu/)).toBeVisible();

  await admin.goto(gameUrl);
  await expect(admin.getByText("Chafik")).toHaveCount(0);
});

test("a regular player can't open the admin pages", async ({ browser }) => {
  const player = await signedInPage(browser, "Dina");
  await player.goto("/admin");
  await expect(player).toHaveURL("/");
  await expect(player.getByRole("link", { name: "Admin" })).toHaveCount(0);
});

test("visitors can see a game but must sign in to join", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Prochains matchs" })).toBeVisible();
  await page
    .getByRole("link", { name: /Foot du dimanche/ })
    .first()
    .click();
  await page.getByRole("link", { name: "Connecte-toi pour t'inscrire" }).click();
  await expect(page).toHaveURL(/\/connexion\?next=%2Fmatchs%2F|\/connexion\?next=\/matchs\//);
});

test("an unknown game shows the not-found page", async ({ page }) => {
  await page.goto("/matchs/pas-un-match");
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await page.goto("/matchs/00000000-0000-4000-8000-000000000000");
  await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
});
