/************************************************************
 * USER APPLICATION
 ************************************************************/

let SCRIPT_URL = "";
let serviceActive = false;


/************************************************************
 * INITIALIZE
 ************************************************************/

async function initialize() {

  try {

    setConnectionBadge(
      "checking",
      "Checking..."
    );


    /*
     * Load connection.json relative to
     * the current User website.
     */

    const configUrl =
      new URL(
        "./config/connection.json",
        window.location.href
      );


    /*
     * Prevent stale configuration.
     */

    configUrl.searchParams.set(
      "v",
      Date.now().toString()
    );


    console.log(
      "CONFIG URL:",
      configUrl.href
    );


    const configResponse =
      await fetch(
        configUrl.href,
        {
          method: "GET",
          cache: "no-store"
        }
      );


    if (!configResponse.ok) {

      throw new Error(
        "connection.json HTTP " +
        configResponse.status
      );

    }


    const config =
      await configResponse.json();


    console.log(
      "CONNECTION CONFIG:",
      config
    );


    /*
     * Check activation.
     */

    if (config.active !== true) {

      showInactive(
        "The administrator has not activated the Google Sheet connection."
      );

      return;

    }


    /*
     * Check script URL.
     */

    if (
      !config.scriptUrl ||
      typeof config.scriptUrl !== "string"
    ) {

      showInactive(
        "The Google Apps Script URL is missing."
      );

      return;

    }


    SCRIPT_URL =
      config.scriptUrl.trim();


    /*
     * Basic URL validation.
     */

    if (
      !SCRIPT_URL.startsWith(
        "https://script.google.com/macros/s/"
      ) ||
      !SCRIPT_URL.endsWith(
        "/exec"
      )
    ) {

      showInactive(
        "The configured Google Apps Script URL is invalid."
      );

      return;

    }


    /*
     * Check ConnectionAPI.
     */

    const separator =
      SCRIPT_URL.includes("?")
        ? "&"
        : "?";


    const statusUrl =
      SCRIPT_URL +
      separator +
      "action=status&t=" +
      Date.now();


    console.log(
      "STATUS URL:",
      statusUrl
    );


    const statusResponse =
      await fetch(
        statusUrl,
        {
          method: "GET",
          cache: "no-store"
        }
      );


    if (!statusResponse.ok) {

      throw new Error(
        "ConnectionAPI HTTP " +
        statusResponse.status
      );

    }


    const status =
      await statusResponse.json();


    console.log(
      "CONNECTION API STATUS:",
      status
    );


    if (status.success !== true) {

      throw new Error(
        status.message ||
        "ConnectionAPI status failed."
      );

    }


    /*
     * Connection successful.
     */

    serviceActive = true;


    showActive();

  }

  catch (error) {

    console.error(
      "INITIALIZATION ERROR:",
      error
    );


    showInactive(
      "Unable to establish the Google Sheet connection."
    );

  }

}


/************************************************************
 * CONNECTION BADGE
 ************************************************************/

function setConnectionBadge(
  status,
  text
) {

  const badge =
    document.getElementById(
      "connectionBadge"
    );


  if (!badge) {
    return;
  }


  badge.className =
    "badge " +
    status;


  badge.textContent =
    text;

}


/************************************************************
 * SHOW ACTIVE APPLICATION
 ************************************************************/

function showActive() {

  setConnectionBadge(
    "connected",
    "● Connected"
  );


  const inactivePanel =
    document.getElementById(
      "inactivePanel"
    );


  const application =
    document.getElementById(
      "application"
    );


  if (inactivePanel) {

    inactivePanel.classList.add(
      "hidden"
    );

  }


  if (application) {

    application.classList.remove(
      "hidden"
    );

  }

}


/************************************************************
 * SHOW INACTIVE APPLICATION
 ************************************************************/

function showInactive(message) {

  serviceActive = false;


  setConnectionBadge(
    "offline",
    "● Not Activated"
  );


  const application =
    document.getElementById(
      "application"
    );


  const inactivePanel =
    document.getElementById(
      "inactivePanel"
    );


  if (application) {

    application.classList.add(
      "hidden"
    );

  }


  if (inactivePanel) {

    inactivePanel.classList.remove(
      "hidden"
    );


    const paragraph =
      inactivePanel.querySelector(
        "p"
      );


    if (
      paragraph &&
      message
    ) {

      paragraph.textContent =
        message;

    }

  }

}


/************************************************************
 * SEARCH RECORDS
 ************************************************************/

async function searchRecords() {

  if (
    !serviceActive ||
    !SCRIPT_URL
  ) {

    showInactive(
      "The Google Sheet connection is not active."
    );

    return;

  }


  const searchInput =
    document.getElementById(
      "searchInput"
    );


  const message =
    document.getElementById(
      "searchMessage"
    );


  const results =
    document.getElementById(
      "searchResults"
    );


  const button =
    document.getElementById(
      "searchButton"
    );


  const query =
    searchInput.value.trim();


  if (!query) {

    message.className =
      "message error";


    message.textContent =
      "Enter something to search.";

    return;

  }


  button.disabled = true;

  button.textContent =
    "Searching...";


  results.innerHTML = "";


  message.className =
    "message";


  message.textContent =
    "Searching...";


  try {

    const url =
      SCRIPT_URL +
      "?action=search&q=" +
      encodeURIComponent(query) +
      "&t=" +
      Date.now();


    const response =
      await fetch(
        url,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        "Search HTTP " +
        response.status
      );

    }


    const data =
      await response.json();


    if (!data.success) {

      message.className =
        "message error";


      message.textContent =
        data.message ||
        "Search failed.";

      return;

    }


    const records =
      Array.isArray(
        data.records
      )
        ? data.records
        : [];


    message.className =
      "message";


    message.textContent =
      records.length
        ? records.length +
          " record(s) found."
        : "No records found.";


    renderRecords(
      records
    );

  }

  catch (error) {

    console.error(
      "SEARCH ERROR:",
      error
    );


    message.className =
      "message error";


    message.textContent =
      "Unable to search records.";

  }

  finally {

    button.disabled = false;

    button.textContent =
      "Search";

  }

}


/************************************************************
 * DISPLAY SEARCH RESULTS
 ************************************************************/

function renderRecords(records) {

  const results =
    document.getElementById(
      "searchResults"
    );


  results.innerHTML = "";


  records.forEach(
    function(record) {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "record-card";


      /*
       * NAME
       */

      const name =
        document.createElement(
          "div"
        );


      name.className =
        "record-name";


      name.textContent =
        record.name ||
        "Unnamed";


      card.appendChild(
        name
      );


      /*
       * EMAIL
       */

      if (record.email) {

        const email =
          document.createElement(
            "div"
          );


        email.className =
          "record-detail";


        email.textContent =
          record.email;


        card.appendChild(
          email
        );

      }


      /*
       * INFORMATION
       */

      if (
        record.information
      ) {

        const information =
          document.createElement(
            "div"
          );


        information.className =
          "record-info";


        information.textContent =
          record.information;


        card.appendChild(
          information
        );

      }


      results.appendChild(
        card
      );

    }
  );

}


/************************************************************
 * SUBMIT RECORD
 ************************************************************/

async function submitRecord(event) {

  event.preventDefault();


  if (
    !serviceActive ||
    !SCRIPT_URL
  ) {

    showInactive(
      "The Google Sheet connection is not active."
    );

    return;

  }


  const name =
    document
      .getElementById(
        "name"
      )
      .value
      .trim();


  const email =
    document
      .getElementById(
        "email"
      )
      .value
      .trim();


  const information =
    document
      .getElementById(
        "information"
      )
      .value
      .trim();


  const message =
    document.getElementById(
      "submitMessage"
    );


  const button =
    document.getElementById(
      "saveButton"
    );


  if (!name) {

    message.className =
      "message error";


    message.textContent =
      "Full name is required.";

    return;

  }


  button.disabled = true;

  button.textContent =
    "Saving...";


  message.className =
    "message";


  message.textContent =
    "Saving...";


  try {

    const response =
      await fetch(
        SCRIPT_URL,
        {

          method:
            "POST",

          body:
            JSON.stringify({

              action:
                "submit",

              name:
                name,

              email:
                email,

              information:
                information

            })

        }
      );


    if (!response.ok) {

      throw new Error(
        "Submit HTTP " +
        response.status
      );

    }


    const data =
      await response.json();


    if (!data.success) {

      message.className =
        "message error";


      message.textContent =
        data.message ||
        "Unable to save record.";

      return;

    }


    message.className =
      "message success";


    message.textContent =
      data.message ||
      "Record saved successfully.";


    document
      .getElementById(
        "recordForm"
      )
      .reset();

  }

  catch (error) {

    console.error(
      "SUBMIT ERROR:",
      error
    );


    message.className =
      "message error";


    message.textContent =
      "Unable to save record.";

  }

  finally {

    button.disabled = false;

    button.textContent =
      "Save Record";

  }

}


/************************************************************
 * EVENT LISTENERS
 ************************************************************/

const recordForm =
  document.getElementById(
    "recordForm"
  );


if (recordForm) {

  recordForm.addEventListener(
    "submit",
    submitRecord
  );

}


const searchInput =
  document.getElementById(
    "searchInput"
  );


if (searchInput) {

  searchInput.addEventListener(
    "keydown",
    function(event) {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        searchRecords();

      }

    }
  );

}


/************************************************************
 * START APPLICATION
 ************************************************************/

initialize();
