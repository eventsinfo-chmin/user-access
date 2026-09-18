let SCRIPT_URL = null;

let serviceActive = false;


/************************************************************
 * INITIALIZE
 ************************************************************/

async function initialize() {

  try {

    const response =
      await fetch(

        "./config/connection.json?v=" +
        Date.now(),

        {
          cache: "no-store"
        }

      );


    if (!response.ok) {

      throw new Error(
        "Unable to load connection configuration."
      );

    }


    const config =
      await response.json();


    if (
      config.active !== true ||
      !config.scriptUrl
    ) {

      showInactive();

      return;

    }


    SCRIPT_URL =
      config.scriptUrl;


    /*
     * Verify Google Apps Script.
     */

    const statusResponse =
      await fetch(

        SCRIPT_URL +

        "?action=status&t=" +

        Date.now()

      );


    const status =
      await statusResponse.json();


    if (!status.success) {

      throw new Error(
        "Google Apps Script unavailable."
      );

    }


    serviceActive =
      true;


    showActive();

  }

  catch (error) {

    console.error(error);


    showInactive(
      "Unable to establish the Google Sheet connection."
    );

  }

}


/************************************************************
 * ACTIVE
 ************************************************************/

function showActive() {

  const badge =
    document.getElementById(
      "connectionBadge"
    );


  badge.className =
    "badge connected";


  badge.textContent =
    "● Connected";


  document
    .getElementById(
      "inactivePanel"
    )
    .classList
    .add("hidden");


  document
    .getElementById(
      "application"
    )
    .classList
    .remove("hidden");

}


/************************************************************
 * INACTIVE
 ************************************************************/

function showInactive(message) {

  SCRIPT_URL = null;

  serviceActive = false;


  const badge =
    document.getElementById(
      "connectionBadge"
    );


  badge.className =
    "badge offline";


  badge.textContent =
    "● Not Activated";


  document
    .getElementById(
      "application"
    )
    .classList
    .add("hidden");


  const panel =
    document.getElementById(
      "inactivePanel"
    );


  panel.classList.remove(
    "hidden"
  );


  if (message) {

    panel
      .querySelector("p")
      .textContent =
        message;

  }

}


/************************************************************
 * SEARCH
 ************************************************************/

async function searchRecords() {

  if (
    !serviceActive ||
    !SCRIPT_URL
  ) {

    return;

  }


  const query =
    document
      .getElementById(
        "searchInput"
      )
      .value
      .trim();


  const message =
    document.getElementById(
      "searchMessage"
    );


  const results =
    document.getElementById(
      "searchResults"
    );


  if (!query) {

    message.textContent =
      "Enter something to search.";

    return;

  }


  const button =
    document.getElementById(
      "searchButton"
    );


  button.disabled = true;

  button.textContent =
    "Searching...";


  results.innerHTML = "";

  message.textContent =
    "Searching...";


  try {

    const response =
      await fetch(

        SCRIPT_URL +

        "?action=search&q=" +

        encodeURIComponent(query) +

        "&t=" +

        Date.now()

      );


    const data =
      await response.json();


    if (!data.success) {

      message.textContent =
        data.message ||
        "Search failed.";

      return;

    }


    const records =
      data.records || [];


    message.textContent =

      records.length

        ? records.length +
          " record(s) found."

        : "No records found.";


    renderRecords(records);

  }

  catch (error) {

    console.error(error);


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
 * RENDER RECORDS
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


      const name =
        document.createElement(
          "div"
        );


      name.className =
        "record-name";


      name.textContent =
        record.name ||
        "Unnamed";


      card.appendChild(name);


      if (record.email) {

        const email =
          document.createElement(
            "div"
          );


        email.className =
          "record-detail";


        email.textContent =
          record.email;


        card.appendChild(email);

      }


      if (record.information) {

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


      results.appendChild(card);

    }
  );

}


/************************************************************
 * SUBMIT RECORD
 ************************************************************/

document
  .getElementById(
    "recordForm"
  )
  .addEventListener(

    "submit",

    async function(event) {

      event.preventDefault();


      if (
        !serviceActive ||
        !SCRIPT_URL
      ) {

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

              method: "POST",

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
          "Record saved successfully.";


        document
          .getElementById(
            "recordForm"
          )
          .reset();

      }

      catch (error) {

        console.error(error);


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

  );


/************************************************************
 * ENTER SEARCH
 ************************************************************/

document
  .getElementById(
    "searchInput"
  )
  .addEventListener(

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


/************************************************************
 * START
 ************************************************************/

initialize();
