const puppeteer = require("puppeteer");
const os = require("os");

const update = async (date) => {
  const client = "Morgan Stanley";
  const chargeable = "Chargeable";
  const project = "MS Fidcom (MZ, MA, AC)";
  const hours = "8";
  const notes = "";

  console.log(`Starting timesheet update for ${date}`);

  const delay = (time) => {
    return new Promise((resolve) => {
      setTimeout(resolve, time);
    });
  };

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--start-maximized", "--detectOpenHandles"],
    executablePath:
      "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    userDataDir: `c:/Users/${
      os.userInfo().username
    }/AppData/Local/Google/Chrome/User Data`,
    defaultViewport: {
      height: 1080,
      width: 1920,
    },
  });

  const [page] = await browser.pages();

  await page.goto("https://app.hibob.com", {
    waitUntil: "networkidle0",
  });

  const isLoggedOut = page.url().includes("login");
  if (isLoggedOut) {
    // login user
    const button = await page.$("button");
    await button.click();
    await page.waitForNetworkIdle();
  }

  // navigate to profile
  const linkToProfile = await page.$("a.primary");
  linkToProfile.click();
  await page.waitForNetworkIdle();

  // start editing timesheet
  const profileCategories = await page.$$("app-employee-profile-category");
  const getTimeSheetEl = () => {
    return new Promise((resolve) => {
      profileCategories.forEach(async (el) => {
        const className = await (await el.getProperty("className")).jsonValue();
        if (className.includes("Timesheets")) {
          resolve(el);
        }
      });
    });
  };

  const timeSheetEl = await getTimeSheetEl();

  // make edit options available --
  const edit = await timeSheetEl.$("button");
  edit.click();

  await page.waitForNetworkIdle();
  await delay(300);

  const [cancelButton, addnewRowButton] = await timeSheetEl.$$(
    "button.secondary"
  );

  addnewRowButton.click();
  await delay(300);

  // fill out form
  const editDialog = await page.$("app-employee-table-edit-dialog");
  const form = await editDialog.$("form");
  const formElements = await form.$$(".form-element");
  Array.from(formElements).forEach(async (el) => {
    const datePicker = await el.$("b-datepicker");
    const singleSelect = await el.$("b-single-select");
    const inputOnly = await el.$("b-input");
    if (datePicker) {
      const input = await datePicker.$("input");
      await page.evaluate(
        (input, date) => {
          input.value = date;
          input.dispatchEvent(new Event("change"));
        },
        input,
        date
      );
    } else if (singleSelect) {
      await page.evaluate(
        (el, client, chargeable, project) => {
          const labelWrapper = el.querySelector("b-form-element-label");
          const labelText =
            labelWrapper.firstElementChild.firstElementChild.firstElementChild
              .textContent;

          const inputWrapper = el.querySelector(".bfe-wrap");
          const dropDownOpener = inputWrapper.querySelector(".select-chevron");
          dropDownOpener.click();

          // once opened b-single-list becomes visible ( the dropdown options )
          const optionsViewport = document.querySelector(
            "cdk-virtual-scroll-viewport"
          );
          const optionsWrapper = optionsViewport.firstElementChild;
          const options = optionsWrapper.querySelector(".options")?.children;
          if (options) {
            let optionWeAreLookingFor;
            if (labelText === "Client") {
              optionWeAreLookingFor = Array.from(options).find(
                (opt) =>
                  opt.firstElementChild.firstElementChild.firstElementChild
                    .textContent == client
              );
            } else if (labelText === "Project") {
              optionWeAreLookingFor = Array.from(options).find(
                (opt) =>
                  opt.firstElementChild.firstElementChild.firstElementChild
                    .textContent == project
              );
            } else if (labelText === "Chargeable") {
              optionWeAreLookingFor = Array.from(options).find(
                (opt) =>
                  opt.firstElementChild.firstElementChild.firstElementChild
                    .textContent == chargeable
              );
            }

            if (optionWeAreLookingFor) {
              optionWeAreLookingFor.click();
            }
          }
        },
        el,
        client,
        chargeable,
        project
      );
    } else if (inputOnly) {
      await page.evaluate(
        (el, hours, notes) => {
          const labelWrapper = el.querySelector("b-form-element-label");
          const labelText =
            labelWrapper.firstElementChild.firstElementChild.firstElementChild
              .textContent;
          const input = el.querySelector(".bfe-input");
          if (labelText == "Hours") {
            input.value = hours;
            input.dispatchEvent(new Event("change"));
          } else if (labelText == "Notes") {
            input.value = notes;
            input.dispatchEvent(new Event("change"));
          }

          input.dispatchEvent(
            new InputEvent("input", {
              bubbles: true,
              cancelable: false,
              data: "a",
            })
          );
        },
        el,
        hours,
        notes
      );
    }
  });

  // submit form
  await page.evaluate(() => {
    const actions = document.querySelector(".action-buttons");
    const addButton = actions.querySelector(".primary");

    setTimeout(() => {
      addButton.click();
    }, 1000);
  });

  await delay(1000);
  await page.waitForNetworkIdle();

  console.log(`Timesheet succesfully updated for ${date}`);

  await browser.close();
};

module.exports = update;
