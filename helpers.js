function cleanPrice(price) {
  const match_dollar = /\$[0-9]+(\.[0-9][0-9])?/g;
  $.trim(price);
  let price_arr = price.match(match_dollar);
  if (price_arr) {
    price = price_arr[0].replace("$", "");
    return parseInt(price);
  }
  return 0;
}

function calculateAverage(service, price_data) {
  //price data item example:
  //{
  //best_buy_price : "$30 $399+ | $99 <$399",
  //home_depot_price : "Free",
  //lowes_price : "$29 $399+ | $79 <$399",
  //service : "Delivery Charges Updated 3/13/2024"
  //}

  for (let i = 0; i < price_data.length; i++) {
    //get correct data element
    if (price_data[i].service == service) {
      let count = 0;

      const best_buy_price = cleanPrice(price_data[i].best_buy_price);
      if (best_buy_price != 0) {
        count++;
      }
      const home_depot_price = cleanPrice(price_data[i].home_depot_price);
      if (home_depot_price != 0) {
        count++;
      }
      const lowes_price = cleanPrice(price_data[i].lowes_price);
      if (lowes_price != 0) {
        count++;
      }

      const average = (best_buy_price + home_depot_price + lowes_price) / count;
      return Math.round(average);
    }
  }
}

function populateDifference(member_price_id, difference_id, average) {
  let member_input = document.getElementById(member_price_id);
  let difference_el = document.getElementById(difference_id);

  //if member inputs 0, difference is just the competitor average
  if (member_input.value == 0) {
    difference_el.innerText = "$" + average;
  }
  //if member inputs a non-zero value, difference is competitor average - member input
  if (member_input.value > 0) {
    let difference = average - member_input.value;
    difference_el.innerText = "$" + difference;
  }
  if (!member_input.value) {
    difference_el.innerText = "";
  }
}

function populateDifferenceNonInput(member_price_id, difference_id, average) {
  let member_price_el = document.getElementById(member_price_id);

  let difference_el = document.getElementById(difference_id);

  //if member inputs 0, difference is just the competitor average
  if (member_price_el.innerText == "$0") {
    difference_el.innerText = "$" + average;
  }

  //if member inputs a non-zero value, difference is competitor average - member input
  if (cleanPrice(member_price_el.innerText) > 0) {
    let difference = average - cleanPrice(member_price_el.innerText);
    difference_el.innerText = "$" + difference;
  }
  if (!member_price_el.innerText) {
    difference_el.innerText = "";
  }
}

function calculateSum() {
  //get sum_display element defined in index.html
  const summed_data = document.getElementById("sum_display");
  let value = 0;
  //get all difference cells and sum up total, populating summed_data element
  let difference_tds = document.querySelectorAll(".difference_td");
  for (let i = 0; i < difference_tds.length; i++) {
    if (difference_tds[i].innerText) {
      value += parseInt(difference_tds[i].innerText);
    }
  }
  summed_data.innerText = value;
}

async function storeMemberInputs() {
  //remove old data
  if (localStorage.getItem("member_prices") != null) {
    localStorage.removeItem("member_prices");
  }
  const member_input_arr = [];
  //push all member inputs to local storage
  inputs = document.querySelectorAll(".member_input");
  inputs.forEach((element) => {
    let input_id = element.id;
    let member_value = parseInt(element.value);
    member_input_arr.push({ [input_id]: +member_value });
  });
  localStorage.setItem("member_prices", JSON.stringify(member_input_arr));
}

async function storeAnnualizedSum() {
  //store four piece kitchen annual sum total
  annualized = document.getElementById("annualized").innerText;
  localStorage.setItem("four_piece_kitchen_annualized_sum", annualized);
}

async function storeTableDeliveryInstall() {
  let td_arr = [];
  let td_sub_arr = {};
  let input_arr = [];
  //need predefined data keys to rename object keys later
  let data_keys = [
    "Service",
    "Best Buy Price",
    "Home Depot Price",
    "Lowes Price",
    "National Average",
    "Dealer's Current Price",
    "+/- From Average	",
    "Dealer's New Price",
    "New +/- From Average",
  ];

  //this stores all table data except headers as formatted JSON
  //get all table data that is not a header
  $(document).ready(function () {
    $(this)
      .find("#delivery_install_table")
      .find("td")
      .not(".header")
      //push 9 elements to sub array object (as we have 9 columns), then push sub array to td_arr (array of json objects)
      .each(function (index, element) {
        //create key:value pair (keys are just sequential numbers at this point)
        td_sub_arr[index] = element.innerText;
        if (Object.keys(td_sub_arr).length == 8) {
          td_arr.push(td_sub_arr);
          td_sub_arr = {};
        }
      });

    //get all input values, since above code only finds td elements (9 rows)
    for (let i = 0; i <= 18; i++) {
      //if at last row, get placeholder value
      if (i == 17) {
        var place_hldr_data = $("#four_piece_delivery_input_current").attr(
          "placeholder"
        );
        input_arr.push(place_hldr_data);
        continue;
      }

      if (i == 18) {
        var place_hldr_data = $("#four_piece_delivery_input_new").attr(
          "placeholder"
        );
        input_arr.push(place_hldr_data);
        break;
      }

      var input_data = $(document).find("input").eq(i).val();
      input_arr.push(input_data);
    }

    //for each td_arr object we are missing the member input field as the first .find("td") does not grab input values
    //populate missing values
    //for each el of input array (looks like this: [1, 2, 3...])
    for (let i = 0; i < input_arr.length; i++) {
      //for each td array element (which are json objects with one val missing: [ {0:"x", 1:"y", 2: ""}, ....])
      for (let j = 0; j < td_arr.length; j++) {
        //for each element in object
        for ([key, val] of Object.entries(td_arr[j])) {
          if (val == "") {
            //found key with missing value, set value to same index as td_arr json object (the order maps perfectly as there are 14 inputs and 14 objects)
            td_arr[j][key] = input_arr[j];
          }
        }
      }
    }

    function rename(obj, oldName, newName) {
      if (!obj.hasOwnProperty(oldName)) {
        return false;
      }

      obj[newName] = obj[oldName];
      delete obj[oldName];
      return true;
    }

    //since all keys are just sequential numbers at this point, we need to rename them to the correct service
    for (sub_arr of td_arr) {
      Object.keys(sub_arr).forEach(function (el, index, arr) {
        rename(sub_arr, el, data_keys[index]);
      });
    }

    localStorage.setItem(
      "delivery_install_download_data",
      JSON.stringify(td_arr)
    );
  });
}

async function storeTableFourPieceKitchen() {
  let td_arr = [];
  let td_sub_arr = {};
  let data_keys = [
    "Service",
    "Best Buy Price",
    "Home Depot Price",
    "Lowes Price",
    "Your Price",
    "Difference",
  ];

  $(document).ready(function () {
    $(this)
      .find("table#four_piece_kitchen_table td")
      .not(".header")
      .each(function (index, element) {
        td_sub_arr[index] = element.innerText;
        if (Object.keys(td_sub_arr).length == 5) {
          td_arr.push(td_sub_arr);
          td_sub_arr = {};
        }
      });

    function rename(obj, oldName, newName) {
      if (!obj.hasOwnProperty(oldName)) {
        return false;
      }

      obj[newName] = obj[oldName];
      delete obj[oldName];
      return true;
    }

    for (sub_arr of td_arr) {
      Object.keys(sub_arr).forEach(function (el, index, arr) {
        rename(sub_arr, el, data_keys[index]);
      });
    }

    //need to get data from delta table
    let delta_text = document.getElementById("delta_cell").innerText;
    let weekly_deliveries = document.getElementById("weekly_deliveries").value;
    let annualized = document.getElementById("annualized").innerText;

    let delta_obj = [
      {
        "Delta from competition average": delta_text,
        "Kitchens delivered weekly": weekly_deliveries,
        "Annual Opportunity": annualized,
      },
    ];

    four_piece_download_data = td_arr.concat(delta_obj);

    localStorage.setItem(
      "four_piece_kitchen_download_data",
      JSON.stringify(four_piece_download_data)
    );
  });
}

function storeTableLaundry() {
  let td_arr = [];
  let td_sub_arr = {};
  let data_keys = [
    "Service",
    "Best Buy Price",
    "Home Depot Price",
    "Lowes Price",
    "Your Price",
    "Difference",
  ];

  $(document).ready(function () {
    $(this)
      .find("table#laundry_table td")
      .not(".header")
      .each(function (index, element) {
        td_sub_arr[index] = element.innerText;
        if (Object.keys(td_sub_arr).length == 5) {
          td_arr.push(td_sub_arr);
          td_sub_arr = {};
        }
      });

    function rename(obj, oldName, newName) {
      if (!obj.hasOwnProperty(oldName)) {
        return false;
      }

      obj[newName] = obj[oldName];
      delete obj[oldName];
      return true;
    }

    for (sub_arr of td_arr) {
      Object.keys(sub_arr).forEach(function (el, index, arr) {
        rename(sub_arr, el, data_keys[index]);
      });
    }

    let delta_text = document.getElementById("delta_cell").innerText;
    let weekly_deliveries = document.getElementById("weekly_deliveries").value;
    let annualized = document.getElementById("annualized").innerText;
    let total_opportunity = document.getElementById("total_sum").innerText;

    let delta_obj = [
      {
        "Delta from competition average": delta_text,
        "Laundry pairs delivered weekly": weekly_deliveries,
        "Annual Opportunity": annualized,
        "Total Annual Opportunity (Kitchen + Laundry)": total_opportunity,
      },
    ];

    laundry_download_data = td_arr.concat(delta_obj);

    localStorage.setItem(
      "laundry_download_data",
      JSON.stringify(laundry_download_data)
    );
  });
}

function downloadStoredTables() {
  let delivery_install_data = JSON.parse(
    localStorage.getItem("delivery_install_download_data")
  );
  let four_piece_kitchen_data = JSON.parse(
    localStorage.getItem("four_piece_kitchen_download_data")
  );
  let laundry_data = JSON.parse(localStorage.getItem("laundry_download_data"));

  let delivery_install_csv = jsonToCsv(delivery_install_data);
  let four_piece_kitchen_csv = jsonToCsvWithDelta(four_piece_kitchen_data);
  let laundry_csv = jsonToCsvWithDelta(laundry_data);

  download(delivery_install_csv, "delivery_install");
  download(four_piece_kitchen_csv, "four_piece_kitchen");
  download(laundry_csv, "laundry");

  let total_opportunity = document.getElementById("total_sum").innerText;
  let user_email = document.getElementById("user_email").value;

  dataLayer.push({
    event: "download",
    user_email: user_email,
    total_opportunity: total_opportunity,
  });
}

//https://www.geeksforgeeks.org/how-to-convert-json-object-to-csv-in-javascript/
function jsonToCsv(jsonData) {
  let csv = "";

  // Extract headers
  let headers = Object.keys(jsonData[0]);
  csv += headers.join(",") + "\n";

  // Extract values
  jsonData.forEach((obj) => {
    let values = headers.map((header) => obj[header]);
    csv += values.join(",") + "\n";
  });

  return csv;
}

//for when there are two sets of headers (extra delta table)
function jsonToCsvWithDelta(jsonData) {
  let csv = "";

  // Extract headers
  let headers = Object.keys(jsonData[0]);
  let delta_headers = Object.keys(jsonData[jsonData.length - 1]);
  csv += headers.join(",") + "\n";

  // Extract values
  jsonData.forEach((obj, index) => {
    if (index == Object.keys(jsonData).length - 1) {
      csv += delta_headers.join(",") + "\n";
      let values = delta_headers.map((header) => obj[header]);
      csv += values.join(",") + "\n";
    }
    let values = headers.map((header) => obj[header]);
    csv += values.join(",") + "\n";
  });

  return csv;
}

//https://www.geeksforgeeks.org/how-to-create-and-download-csv-file-in-javascript/
const download = (data, name) => {
  // Create a Blob with the CSV data and type
  const blob = new Blob([data], { type: "text/csv" });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create an anchor tag for downloading
  const a = document.createElement("a");

  // Set the URL and download attribute of the anchor tag
  a.href = url;
  a.download = name + ".csv";

  // Trigger the download by clicking the anchor tag
  a.click();
};

function fourPieceKitchenValues(table_display_data, member_prices) {
  //add member prices to display data
  table_display_data[0].member_price = "$" + member_prices[0].delivery_charges;
  table_display_data[1].member_price = "$" + member_prices[1].haul_away * 4;
  table_display_data[2].member_price = "$" + member_prices[13].h2o_hook_up;
  table_display_data[3].member_price = "$" + member_prices[11].range_cord;
  table_display_data[4].member_price = "$" + member_prices[2].otr_install;
  table_display_data[5].member_price =
    "$" +
    //predefined formula
    parseInt(member_prices[3].dw_install);
  //	parseInt(member_prices[12].dw_kit));

  let sum = 0;
  for (let i = 0; i <= 5; i++) {
    sum += cleanPrice(table_display_data[i].member_price);
  }

  table_display_data[6].sum = "$" + sum;
  table_display_data[7].text = "How has your pricing changed?";
  return table_display_data;
}

function laundryValues(table_display_data, member_prices) {
  table_display_data[0].member_price = "$" + member_prices[0].delivery_charges;
  //"$" + member_prices[0].delivery_charges * 2;
  table_display_data[1].member_price = "$" + member_prices[1].haul_away * 2;

  table_display_data[2].member_price = "$" + member_prices[8].ss_fill_hose_set;
  //table_display_data[2].member_price = "$" + member_prices[7].rubber_fill_hose;
  table_display_data[3].member_price =
    "$" +
    (parseInt(member_prices[9].vent_kit) +
      parseInt(member_prices[10].dryer_cord));

  let sum = 0;
  for (let i = 0; i <= 3; i++) {
    sum += cleanPrice(table_display_data[i].member_price);
  }

  table_display_data[4].sum = sum;
  table_display_data[5].text = "How has your pricing changed?";
  return table_display_data;
}


async function deliveryInstallSetup() {
  const services = [
    "delivery_charges",
    "haul_away",
    "otr_install",
    "dw_install",
    "gas_range_install",
    "electric_range_cord",
    "dw_kit",
    "h2o_hook_up",
    "four_piece_delivery",
  ];
  //get delivery install
  await $.getJSON("https://nodetest-f6jnhptmxa-uc.a.run.app/delivery_install", function (result) {
    const delivery_install_display_data = result;

    let data_arr = [];
    //render table by looping through display data and creating td and member inputs
    //for each item in delivery_install_display_data, create table row, store in data_arr

    $.each(delivery_install_display_data, function (index, item) {
      data_arr.push("<tr>");
      //for each element in item, create table cell
      $.each(item, function (index, item_data) {
        data_arr.push("<td class='item_data'>" + item_data + "</td>");
      });
      //add national average
      data_arr.push(
        `<td class='national_average_td' id=${
          services[index] + "_national_average"
        }>`
      );
      //add member input current
      data_arr.push("<td class='member_input_current_td'>");
      data_arr.push(
        `<input class="member_input_current" id=${
          services[index] + "_input_current"
        }>`
      );
      //add cell where difference will populate
      data_arr.push(
        `<td class="difference_current_td" id=${
          services[index] + "_difference_current"
        }>`
      );
      //add member input new
      data_arr.push("<td class='member_input_new_td'>");
      data_arr.push(
        `<input class="member_input_new" id=${services[index] + "_input_new"}>`
      );
      //add cell where difference will populate
      data_arr.push(
        `<td class="difference_new_td" id=${
          services[index] + "_difference_new"
        }>`
      );
      //close table row
      data_arr.push("</tr>");
    });

    //get element (defined in index.html)
    const delivery_install_table = $("#delivery_install_table");
    //append data_arr to table
    delivery_install_table.append(data_arr.join(""));

    //assign services declared above to copy of data to use in average calculation
    let price_data = result;
    price_data.forEach(function (element, index) {
      element.service = services[index];
    });
    national_average_cells = Array.from(
      document.getElementsByClassName("national_average_td")
    );
    national_average_cells.forEach(function (element, index) {
      let id = element.id.replace("_national_average", "");
      let average = calculateAverage(id, price_data);
      element.innerText = "$" + average;
    });
  });

  //add event listener to calculate (competitor average - member input) for each input field
  let inputs_current = document.querySelectorAll(".member_input_current");
  inputs_current.forEach((element, index) => {
    element.addEventListener("input", function () {
      let service_id = services[index];
      let input_current_id = this.id;
      let member_value = parseInt(this.value);
      let difference_td_current_id = service_id + "_difference_current";
      let average = cleanPrice(
        document.getElementById(service_id + "_national_average").innerText
      );
      populateDifference(input_current_id, difference_td_current_id, average);
    });
  });

  inputs_new = document.querySelectorAll(".member_input_new");
  inputs_new.forEach((element, index) => {
    element.addEventListener("input", function () {
      let service_id = services[index];
      let input_new_id = this.id;
      let member_value = parseInt(this.value);
      let difference_td_new_id = service_id + "_difference_new";
      let average = cleanPrice(
        document.getElementById(service_id + "_national_average").innerText
      );
      populateDifference(input_new_id, difference_td_new_id, average);
    });
  });

  //form started tracking
  const delivery_input_current = document.getElementById(
    "delivery_charges_input_current"
  );
  const delivery_input_new = document.getElementById(
    "delivery_charges_input_new"
  );
  delivery_input_current.addEventListener(
    "input",
    function () {
      dataLayer.push({
        event: "form_start",
      });
    },
    { once: true }
  );

  const four_piece_input_current = document.getElementById(
    "four_piece_delivery_input_current"
  );
  four_piece_input_current.readOnly = true;

  const four_piece_input_new = document.getElementById(
    "four_piece_delivery_input_new"
  );
  four_piece_input_new.readOnly = true;

  let national_average_four_piece_delivery = cleanPrice(
    document.getElementById("four_piece_delivery_national_average").innerText
  );

  const haul_away_input_current = document.getElementById(
    "haul_away_input_current"
  );
  const haul_away_input_new = document.getElementById("haul_away_input_new");
  const otr_install_input_current = document.getElementById(
    "otr_install_input_current"
  );
  const otr_install_input_new = document.getElementById(
    "otr_install_input_new"
  );
  const dw_install_input_current = document.getElementById(
    "dw_install_input_current"
  );
  const dw_install_input_new = document.getElementById("dw_install_input_new");
  const range_cord_input_current = document.getElementById(
    "electric_range_cord_input_current"
  );
  const range_cord_input_new = document.getElementById(
    "electric_range_cord_input_new"
  );
  const h2o_hook_up_input_current = document.getElementById(
    "h2o_hook_up_input_current"
  );
  const h2o_hook_up_input_new = document.getElementById(
    "h2o_hook_up_input_new"
  );

  //add event listener to h2o hookup field as we will use all previous inputs to calculate four piece input placeholder
  //if all fields have values, calculate four_piece delivery and populate placeholder
  h2o_hook_up_input_current.addEventListener("input", function () {
    if (
      delivery_input_current.value.length >= 1 &&
      haul_away_input_current.value.length >= 1 &&
      otr_install_input_current.value.length >= 1 &&
      dw_install_input_current.value.length >= 1 &&
      range_cord_input_current.value.length >= 1 &&
      h2o_hook_up_input_current.value.length >= 1
    ) {
      let four_piece_member_price_current =
        parseInt(delivery_input_current.value) +
        parseInt(haul_away_input_current.value) * 4 +
        parseInt(otr_install_input_current.value) +
        parseInt(dw_install_input_current.value) +
        parseInt(range_cord_input_current.value) +
        parseInt(h2o_hook_up_input_current.value);

      four_piece_input_current.value = four_piece_member_price_current;

      let four_piece_difference_current = document.getElementById(
        "four_piece_delivery_difference_current"
      );

      four_piece_difference_current.innerText =
        "$" +
        (national_average_four_piece_delivery -
          four_piece_member_price_current);

      let four_piece_current_prices_arr = [];
      four_piece_current_prices_arr.push(
        parseInt(delivery_input_current.value),
        parseInt(haul_away_input_current.value * 4),
        parseInt(h2o_hook_up_input_current.value),
        parseInt(range_cord_input_current.value),
        parseInt(otr_install_input_current.value),
        parseInt(dw_install_input_current.value)
      );

      let current_four_piece_cells = Array.from(
        document.getElementsByClassName("dealers_current_four_piece")
      );
      let four_piece_total_current = current_four_piece_cells.at(-1);
      let sum = 0;
      for (let i = 0; i <= four_piece_current_prices_arr.length; i++) {
        if (i == four_piece_current_prices_arr.length) {
          four_piece_total_current.innerText = "$" + sum;
          break;
        }
        sum += four_piece_current_prices_arr[i];
        current_four_piece_cells[i].innerText =
          "$" + four_piece_current_prices_arr[i];
      }

      let national_average_cells = Array.from(
        document.getElementsByClassName("national_average_td_four_piece")
      );
      let difference_current_td_four_piece = Array.from(
        document.getElementsByClassName("difference_current_td_four_piece")
      );

      for (let i = 0; i < current_four_piece_cells.length; i++) {
        populateDifferenceNonInput(
          current_four_piece_cells[i].id,
          difference_current_td_four_piece[i].id,
          cleanPrice(national_average_cells[i].innerText)
        );
      }

      let delivery_install_current_delta = document.getElementById(
        "delivery_install_current_delta"
      );

      let delivery_install_new_delta = document.getElementById(
        "delivery_install_new_delta"
      );
      let total_national_average_four_piece = cleanPrice(
        document.getElementById("total_national_average_four_piece").innerText
      );
      delivery_install_current_delta.innerText =
        "$" +
        (total_national_average_four_piece -
          cleanPrice(four_piece_total_current.innerText));

      let four_piece_delta_from_current_price = document.getElementById(
        "four_piece_delta_from_current_price"
      );

      four_piece_delta_from_current_price.innerText =
        "$" +
        (cleanPrice(delivery_install_current_delta.innerText) -
          cleanPrice(delivery_install_new_delta.innerText));
    }
  });

  h2o_hook_up_input_new.addEventListener("input", function () {
    if (
      delivery_input_new.value.length >= 1 &&
      haul_away_input_new.value.length >= 1 &&
      otr_install_input_new.value.length >= 1 &&
      dw_install_input_new.value.length >= 1 &&
      range_cord_input_new.value.length >= 1 &&
      h2o_hook_up_input_new.value.length >= 1
    ) {
      let four_piece_member_price_new =
        parseInt(delivery_input_new.value) +
        parseInt(haul_away_input_new.value) * 4 +
        parseInt(otr_install_input_new.value) +
        parseInt(dw_install_input_new.value) +
        parseInt(range_cord_input_new.value) +
        parseInt(h2o_hook_up_input_new.value);

      four_piece_input_new.value = four_piece_member_price_new;

      let four_piece_difference_new = document.getElementById(
        "four_piece_delivery_difference_new"
      );

      four_piece_difference_new.innerText =
        "$" +
        (national_average_four_piece_delivery - four_piece_member_price_new);

      let four_piece_new_prices_arr = [];
      four_piece_new_prices_arr.push(
        parseInt(delivery_input_new.value),
        parseInt(haul_away_input_new.value * 4),
        parseInt(h2o_hook_up_input_new.value),
        parseInt(range_cord_input_new.value),
        parseInt(otr_install_input_new.value),
        parseInt(dw_install_input_new.value)
      );

      let new_four_piece_cells = Array.from(
        document.getElementsByClassName("dealers_new_four_piece")
      );
      let four_piece_total_new = new_four_piece_cells.at(-1);
      let sum = 0;
      for (let i = 0; i <= four_piece_new_prices_arr.length; i++) {
        if (i == four_piece_new_prices_arr.length) {
          four_piece_total_new.innerText = "$" + sum;
          break;
        }
        sum += four_piece_new_prices_arr[i];
        new_four_piece_cells[i].innerText = "$" + four_piece_new_prices_arr[i];
      }

      let national_average_cells = Array.from(
        document.getElementsByClassName("national_average_td_four_piece")
      );
      let difference_new_td_four_piece = Array.from(
        document.getElementsByClassName("difference_new_td_four_piece")
      );

      for (let i = 0; i < new_four_piece_cells.length; i++) {
        populateDifferenceNonInput(
          new_four_piece_cells[i].id,
          difference_new_td_four_piece[i].id,
          cleanPrice(national_average_cells[i].innerText)
        );
      }

      let delivery_install_new_delta = document.getElementById(
        "delivery_install_new_delta"
      );
      let total_national_average_four_piece = cleanPrice(
        document.getElementById("total_national_average_four_piece").innerText
      );
      delivery_install_new_delta.innerText =
        "$" +
        (total_national_average_four_piece -
          cleanPrice(four_piece_total_new.innerText));

      let delivery_install_current_delta = cleanPrice(
        document.getElementById("delivery_install_current_delta").innerText
      );

      let four_piece_delta_from_current_price = document.getElementById(
        "four_piece_delta_from_current_price"
      );

      four_piece_delta_from_current_price.innerText =
        "$" +
        (delivery_install_current_delta -
          cleanPrice(delivery_install_new_delta.innerText));
    }
  });
}

async function fourPieceKitchenSetup() {
  const services = [
    "delivery_charges",
    "haul_away",
    "refrigerator",
    "electric_range_cord",
    "otr_install",
    "dw_install",
    "total",
  ];
  //get delivery install
  await $.getJSON(
    "https://nodetest-f6jnhptmxa-uc.a.run.app/four_piece_kitchen",
    function (result) {
      const four_piece_kitchen_display_data = result;

      let data_arr = [];
      //render table by looping through display data and creating td and member inputs
      //for each item in delivery_install_display_data, create table row, store in data_arr

      $.each(four_piece_kitchen_display_data, function (index, item) {
        data_arr.push("<tr>");
        //for each element in item, create table cell
        $.each(item, function (index, item_data) {
          data_arr.push("<td class='item_data'>" + item_data + "</td>");
        });
        //add national average
        data_arr.push(
          `<td class='national_average_td_four_piece' id=${
            services[index] + "_national_average_four_piece"
          }>`
        );
        //add member input current
        data_arr.push(
          `<td class='dealers_current_four_piece' id=${
            services[index] + "_member_price_four_piece_current"
          }>`
        );

        //add cell where difference will populate
        data_arr.push(
          `<td class="difference_current_td_four_piece" id=${
            services[index] + "_difference_current_four_piece"
          }>`
        );
        //add member input new
        data_arr.push(
          `<td class='dealers_new_four_piece'id=${
            services[index] + "_member_price_four_piece_new"
          }>`
        );

        //add cell where difference will populate
        data_arr.push(
          `<td class="difference_new_td_four_piece" id=${
            services[index] + "_difference_new_four_piece"
          }>`
        );
        //close table row
        data_arr.push("</tr>");
      });

      //get element (defined in index.html)
      const four_piece_kitchen_table = $("#four_piece_kitchen_table");
      //append data_arr to table
      four_piece_kitchen_table.append(data_arr.join(""));

      //assign services declared above to copy of data to use in average calculation
      let price_data = result;
      price_data.forEach(function (element, index) {
        element.service = services[index];
      });
      national_average_cells = Array.from(
        document.getElementsByClassName("national_average_td_four_piece")
      );
      national_average_cells.forEach(function (element, index) {
        let id = element.id.replace("_national_average_four_piece", "");
        let average = calculateAverage(id, price_data);
        element.innerText = "$" + average;
      });

      let delivery_installed_weekly_input = document.getElementById(
        "delivery_install_kitchens_delivered_weekly"
      );
      delivery_installed_weekly_input.addEventListener("input", function () {
        let delivery_install_current_annualized = document.getElementById(
          "delivery_install_current_annualized"
        );
        let delivery_install_current_delta = cleanPrice(
          document.getElementById("delivery_install_current_delta").innerText
        );
        let annualized =
          delivery_install_current_delta *
          delivery_installed_weekly_input.value *
          52;
        delivery_install_current_annualized.innerText = "$" + annualized;
      });

      let delivery_installed_weekly_input_new = document.getElementById(
        "delivery_install_kitchens_delivered_weekly_new"
      );
      delivery_installed_weekly_input_new.addEventListener(
        "input",
        function () {
          let delivery_install_new_annualized = document.getElementById(
            "delivery_install_new_annualized"
          );
          let delivery_install_new_delta = cleanPrice(
            document.getElementById("delivery_install_new_delta").innerText
          );
          let annualized =
            delivery_install_new_delta *
            delivery_installed_weekly_input_new.value *
            52;
          delivery_install_new_annualized.innerText = "$" + annualized;

          let delivery_install_delta_from_current_price_annualized =
            document.getElementById(
              "delivery_install_delta_from_current_price_annualized"
            );
          let four_piece_delta_from_current_price = cleanPrice(
            document.getElementById("four_piece_delta_from_current_price")
              .innerText
          );
          delivery_install_delta_from_current_price_annualized.innerText =
            "$" +
            four_piece_delta_from_current_price *
              delivery_installed_weekly_input_new.value;
        }
      );
    }
  );
}

async function laundrySetup() {
  const services = [
    "delivery_charges",
    "haul_away",
    "rubber_fill_hose",
    "ss_fill_hose",
    "vent_kit",
    "dryer_cord",
    "gas_dryer_install_no_steam",
    "gas_dryer_install_steam",
  ];
  //get delivery install
  await $.getJSON(
    "https://nodetest-f6jnhptmxa-uc.a.run.app/laundry_delivery_install",
    function (result) {
      const laundry_display_data = result;

      let data_arr = [];
      //render table by looping through display data and creating td and member inputs
      //for each item in delivery_install_display_data, create table row, store in data_arr

      $.each(laundry_display_data, function (index, item) {
        data_arr.push("<tr>");
        //for each element in item, create table cell
        $.each(item, function (index, item_data) {
          data_arr.push("<td class='item_data_laundry'>" + item_data + "</td>");
        });
        //add national average
        data_arr.push(
          `<td class='national_average_td_laundry' id=${
            services[index] + "_national_average_laundry"
          }>`
        );
        //add member input current
        data_arr.push("<td class='member_input_current_td_laundry'>");
        data_arr.push(
          `<input class="member_input_current_laundry" id=${
            services[index] + "_input_current_laundry"
          }>`
        );
        //add cell where difference will populate
        data_arr.push(
          `<td class="difference_current_td_laundry" id=${
            services[index] + "_difference_current_laundry"
          }>`
        );
        //add member input new
        data_arr.push("<td class='member_input_new_td_laundry'>");
        data_arr.push(
          `<input class="member_input_new_laundry" id=${
            services[index] + "_input_new_laundry"
          }>`
        );
        //add cell where difference will populate
        data_arr.push(
          `<td class="difference_new_td_laundry" id=${
            services[index] + "_difference_new_laundry"
          }>`
        );
        //close table row
        data_arr.push("</tr>");
      });

      //get element (defined in index.html)
      const laundry_table = $("#laundry_table");
      //append data_arr to table
      laundry_table.append(data_arr.join(""));

      //assign services declared above to copy of data to use in average calculation
      let price_data = result;
      price_data.forEach(function (element, index) {
        element.service = services[index];
      });
      national_average_cells = Array.from(
        document.getElementsByClassName("national_average_td_laundry")
      );
      national_average_cells.forEach(function (element, index) {
        let id = element.id.replace("_national_average_laundry", "");
        let average = calculateAverage(id, price_data);
        element.innerText = "$" + average;
      });
    }
  );

  //add event listener to calculate (competitor average - member input) for each input field
  let inputs_current = document.querySelectorAll(
    ".member_input_current_laundry"
  );
  inputs_current.forEach((element, index) => {
    element.addEventListener("input", function () {
      let service_id = services[index];
      let input_current_id = this.id;
      let member_value = parseInt(this.value);
      let difference_td_current_id = service_id + "_difference_current_laundry";
      let average = cleanPrice(
        document.getElementById(service_id + "_national_average_laundry")
          .innerText
      );
      populateDifference(input_current_id, difference_td_current_id, average);
    });
  });

  inputs_new = document.querySelectorAll(".member_input_new_laundry");
  inputs_new.forEach((element, index) => {
    element.addEventListener("input", function () {
      let service_id = services[index];
      let input_new_id = this.id;
      let member_value = parseInt(this.value);
      let difference_td_new_id = service_id + "_difference_new_laundry";
      let average = cleanPrice(
        document.getElementById(service_id + "_national_average_laundry")
          .innerText
      );
      populateDifference(input_new_id, difference_td_new_id, average);
    });
  });
}

async function laundryCalcSetup() {
  const services = [
    "delivery_charges",
    "haul_away",
    "washer",
    "dryer",
    "total",
  ];
  //get delivery install
  await $.getJSON("https://nodetest-f6jnhptmxa-uc.a.run.app/laundry_calc", function (result) {
    const laundry_calc_display_data = result;

    let data_arr = [];
    //render table by looping through display data and creating td and member inputs
    //for each item in delivery_install_display_data, create table row, store in data_arr

    $.each(laundry_calc_display_data, function (index, item) {
      data_arr.push("<tr>");
      //for each element in item, create table cell
      $.each(item, function (index, item_data) {
        data_arr.push("<td class='item_data_laundry'>" + item_data + "</td>");
      });
      //add national average
      data_arr.push(
        `<td class='national_average_td_four_piece_laundry_calc' id=${
          services[index] + "_national_average_four_piece_laundry_calc"
        }>`
      );
      //add member input current
      data_arr.push(
        `<td class='dealers_current_laundry_calc' id=${
          services[index] + "_member_price_laundry_calc_current"
        }>`
      );

      //add cell where difference will populate
      data_arr.push(
        `<td class="difference_current_td_laundry_calc" id=${
          services[index] + "_difference_current_laundry_calc"
        }>`
      );
      //add member input new
      data_arr.push(
        `<td class='dealers_new_laundry_calc'id=${
          services[index] + "_member_price_laundry_calc_new"
        }>`
      );

      //add cell where difference will populate
      data_arr.push(
        `<td class="difference_new_td_laundry_calc" id=${
          services[index] + "_difference_new_laundry_calc"
        }>`
      );
      //close table row
      data_arr.push("</tr>");
    });

    //get element (defined in index.html)
    const laundry_calc_table = $("#laundry_calculator_table");
    //append data_arr to table
    laundry_calc_table.append(data_arr.join(""));

    //assign services declared above to copy of data to use in average calculation
    let price_data = result;
    price_data.forEach(function (element, index) {
      element.service = services[index];
    });
    national_average_cells = Array.from(
      document.getElementsByClassName(
        "national_average_td_four_piece_laundry_calc"
      )
    );
    national_average_cells.forEach(function (element, index) {
      let id = element.id.replace(
        "_national_average_four_piece_laundry_calc",
        ""
      );
      let average = calculateAverage(id, price_data);
      element.innerText = "$" + average;
    });
  });

  let delivery_charges_input_current_laundry = document.getElementById(
    "delivery_charges_input_current_laundry"
  );
  let haul_away_input_current_laundry = document.getElementById(
    "haul_away_input_current_laundry"
  );
  let rubber_fill_hose_input_current_laundry = document.getElementById(
    "rubber_fill_hose_input_current_laundry"
  );
  let ss_fill_hose_input_current_laundry = document.getElementById(
    "ss_fill_hose_input_current_laundry"
  );
  let vent_kit_input_current_laundry = document.getElementById(
    "vent_kit_input_current_laundry"
  );
  let dryer_cord_input_current_laundry = document.getElementById(
    "dryer_cord_input_current_laundry"
  );
  let gas_dryer_install_steam_input_current_laundry = document.getElementById(
    "gas_dryer_install_steam_input_current_laundry"
  );
  let gas_dryer_install_no_steam_input_current_laundry =
    document.getElementById("gas_dryer_install_no_steam_input_current_laundry");

  gas_dryer_install_steam_input_current_laundry.addEventListener(
    "input",
    function () {
      if (
        delivery_charges_input_current_laundry.value.length >= 1 &&
        haul_away_input_current_laundry.value.length >= 1 &&
        rubber_fill_hose_input_current_laundry.value.length >= 1 &&
        ss_fill_hose_input_current_laundry.value.length >= 1 &&
        vent_kit_input_current_laundry.value.length >= 1 &&
        dryer_cord_input_current_laundry.value.length >= 1 &&
        gas_dryer_install_no_steam_input_current_laundry.value.length >= 1
      ) {
        let delivery_charges_member_price_laundry_calc_current =
          document.getElementById(
            "delivery_charges_member_price_laundry_calc_current"
          );
        let haul_away_member_price_laundry_calc_current =
          document.getElementById(
            "haul_away_member_price_laundry_calc_current"
          );
        let washer_member_price_laundry_calc_current = document.getElementById(
          "washer_member_price_laundry_calc_current"
        );
        let dryer_member_price_laundry_calc_current = document.getElementById(
          "dryer_member_price_laundry_calc_current"
        );
        let total_member_price_laundry_calc_current = document.getElementById(
          "total_member_price_laundry_calc_current"
        );

        delivery_charges_member_price_laundry_calc_current.innerText =
          "$" + delivery_charges_input_current_laundry.value;

        haul_away_member_price_laundry_calc_current.innerText =
          "$" + haul_away_input_current_laundry.value * 2;

        washer_member_price_laundry_calc_current.innerText =
          "$" + ss_fill_hose_input_current_laundry.value;

        dryer_member_price_laundry_calc_current.innerText =
          "$" +
          (parseInt(vent_kit_input_current_laundry.value) +
            parseInt(dryer_cord_input_current_laundry.value));

        total_member_price_laundry_calc_current.innerText =
          "$" +
          (parseInt(delivery_charges_input_current_laundry.value) +
            parseInt(haul_away_input_current_laundry.value) * 2 +
            parseInt(ss_fill_hose_input_current_laundry.value) +
            parseInt(vent_kit_input_current_laundry.value) +
            parseInt(dryer_cord_input_current_laundry.value));
      }

      let dealers_current_laundry_calc = document.getElementsByClassName(
        "dealers_current_laundry_calc"
      );
      let national_average_td_four_piece_laundry_calc =
        document.getElementsByClassName(
          "national_average_td_four_piece_laundry_calc"
        );
      let difference_current_td_laundry_calc = document.getElementsByClassName(
        "difference_current_td_laundry_calc"
      );

      for (let i = 0; i < dealers_current_laundry_calc.length; i++) {
        populateDifferenceNonInput(
          dealers_current_laundry_calc[i].id,
          difference_current_td_laundry_calc[i].id,
          cleanPrice(national_average_td_four_piece_laundry_calc[i].innerText)
        );
      }

      let laundry_current_delta = document.getElementById(
        "laundry_current_delta"
      );

      let total_national_average_four_piece_laundry_calc =
        document.getElementById(
          "total_national_average_four_piece_laundry_calc"
        );

      laundry_current_delta.innerText =
        "$" +
        (cleanPrice(total_national_average_four_piece_laundry_calc.innerText) -
          cleanPrice(total_member_price_laundry_calc_current.innerText));

      let laundry_pairs_delivered_weekly_input = document.getElementById(
        "laundry_pairs_delivered_weekly"
      );
      laundry_pairs_delivered_weekly_input.addEventListener(
        "input",
        function () {
          let laundry_current_annualized = document.getElementById(
            "laundry_current_annualized"
          );
          let laundry_current_delta = cleanPrice(
            document.getElementById("laundry_current_delta").innerText
          );
          let annualized =
            laundry_current_delta *
            laundry_pairs_delivered_weekly_input.value *
            52;
          laundry_current_annualized.innerText = "$" + annualized;

          let delivery_install_current_annualized = document.getElementById(
            "delivery_install_current_annualized"
          );

          let sum_current = document.getElementById("sum_current");
          sum_current.innerText =
            "$" +
            cleanPrice(laundry_current_annualized.innerText) +
            cleanPrice(delivery_install_current_annualized.innerText);
        }
      );
    }
  );

  let delivery_charges_input_new_laundry = document.getElementById(
    "delivery_charges_input_new_laundry"
  );
  let haul_away_input_new_laundry = document.getElementById(
    "haul_away_input_new_laundry"
  );
  let rubber_fill_hose_input_new_laundry = document.getElementById(
    "rubber_fill_hose_input_new_laundry"
  );
  let ss_fill_hose_input_new_laundry = document.getElementById(
    "ss_fill_hose_input_new_laundry"
  );
  let vent_kit_input_new_laundry = document.getElementById(
    "vent_kit_input_new_laundry"
  );
  let dryer_cord_input_new_laundry = document.getElementById(
    "dryer_cord_input_new_laundry"
  );
  let gas_dryer_install_steam_input_new_laundry = document.getElementById(
    "gas_dryer_install_steam_input_new_laundry"
  );
  let gas_dryer_install_no_steam_input_new_laundry = document.getElementById(
    "gas_dryer_install_no_steam_input_new_laundry"
  );

  gas_dryer_install_steam_input_new_laundry.addEventListener(
    "input",
    function () {
      if (
        delivery_charges_input_new_laundry.value.length >= 1 &&
        haul_away_input_new_laundry.value.length >= 1 &&
        rubber_fill_hose_input_new_laundry.value.length >= 1 &&
        ss_fill_hose_input_new_laundry.value.length >= 1 &&
        vent_kit_input_new_laundry.value.length >= 1 &&
        dryer_cord_input_new_laundry.value.length >= 1 &&
        gas_dryer_install_no_steam_input_new_laundry.value.length >= 1
      ) {
        let delivery_charges_member_price_laundry_calc_new =
          document.getElementById(
            "delivery_charges_member_price_laundry_calc_new"
          );
        let haul_away_member_price_laundry_calc_new = document.getElementById(
          "haul_away_member_price_laundry_calc_new"
        );
        let washer_member_price_laundry_calc_new = document.getElementById(
          "washer_member_price_laundry_calc_new"
        );
        let dryer_member_price_laundry_calc_new = document.getElementById(
          "dryer_member_price_laundry_calc_new"
        );
        let total_member_price_laundry_calc_new = document.getElementById(
          "total_member_price_laundry_calc_new"
        );

        delivery_charges_member_price_laundry_calc_new.innerText =
          "$" + delivery_charges_input_new_laundry.value;

        haul_away_member_price_laundry_calc_new.innerText =
          "$" + haul_away_input_new_laundry.value * 2;

        washer_member_price_laundry_calc_new.innerText =
          "$" + ss_fill_hose_input_new_laundry.value;

        dryer_member_price_laundry_calc_new.innerText =
          "$" +
          (parseInt(vent_kit_input_new_laundry.value) +
            parseInt(dryer_cord_input_new_laundry.value));

        total_member_price_laundry_calc_new.innerText =
          "$" +
          (parseInt(delivery_charges_input_new_laundry.value) +
            parseInt(haul_away_input_new_laundry.value) * 2 +
            parseInt(ss_fill_hose_input_new_laundry.value) +
            parseInt(vent_kit_input_new_laundry.value) +
            parseInt(dryer_cord_input_new_laundry.value));

        let dealers_new_laundry_calc = document.getElementsByClassName(
          "dealers_new_laundry_calc"
        );
        let national_average_td_four_piece_laundry_calc =
          document.getElementsByClassName(
            "national_average_td_four_piece_laundry_calc"
          );
        let difference_new_td_laundry_calc = document.getElementsByClassName(
          "difference_new_td_laundry_calc"
        );

        for (let i = 0; i < dealers_new_laundry_calc.length; i++) {
          populateDifferenceNonInput(
            dealers_new_laundry_calc[i].id,
            difference_new_td_laundry_calc[i].id,
            cleanPrice(national_average_td_four_piece_laundry_calc[i].innerText)
          );
        }
      }

      let laundry_new_delta = document.getElementById("laundry_new_delta");

      let total_national_average_four_piece_laundry_calc =
        document.getElementById(
          "total_national_average_four_piece_laundry_calc"
        );

      laundry_new_delta.innerText =
        "$" +
        (cleanPrice(total_national_average_four_piece_laundry_calc.innerText) -
          cleanPrice(total_member_price_laundry_calc_new.innerText));

      let laundry_pairs_delivered_weekly_input_new = document.getElementById(
        "laundry_pairs_delivered_weekly_new"
      );
      laundry_pairs_delivered_weekly_input_new.addEventListener(
        "input",
        function () {
          let laundry_new_annualized = document.getElementById(
            "laundry_new_annualized"
          );
          let laundry_new_delta = cleanPrice(
            document.getElementById("laundry_new_delta").innerText
          );
          let annualized =
            laundry_new_delta *
            laundry_pairs_delivered_weekly_input_new.value *
            52;
          laundry_new_annualized.innerText = "$" + annualized;

          let delivery_install_new_annualized = document.getElementById(
            "delivery_install_new_annualized"
          );

          let sum_new = document.getElementById("sum_new");
          sum_new.innerText =
            "$" +
            cleanPrice(laundry_new_annualized.innerText) +
            cleanPrice(delivery_install_new_annualized.innerText);
        }
      );

      let laundry_current_delta = document.getElementById(
        "laundry_current_delta"
      );

      let laundry_delta_from_current_price = document.getElementById(
        "laundry_delta_from_current_price"
      );

      laundry_delta_from_current_price.innerText =
        "$" +
        (cleanPrice(laundry_current_delta.innerText) -
          cleanPrice(laundry_new_delta.innerText));

      laundry_pairs_delivered_weekly_input_new.addEventListener(
        "input",
        function () {
          let laundry_delta_from_current_price_annualized =
            document.getElementById(
              "laundry_delta_from_current_price_annualized"
            );
          laundry_delta_from_current_price_annualized.innerText =
            cleanPrice(laundry_delta_from_current_price.innerText) *
            laundry_pairs_delivered_weekly_input_new.value;
        }
      );
    }
  );
}

function downloadDataDeliveryInstall() {
  header_names = [];
  let headers = Array.from(document.getElementsByClassName("header"));
  for (let i = 0; i < headers.length; i++) {
    header_names.push(headers[i].innerText);
  }
  let delivery_install_table = document.getElementById(
    "delivery_install_table"
  );
  let delivery_install_table_item_data = Array.from(
    delivery_install_table.querySelectorAll("td.item_data")
  );

  let delivery_install_table_item_data_text = [];

  for (let i = 0; i < delivery_install_table_item_data.length; i++) {
    delivery_install_table_item_data_text.push(
      delivery_install_table_item_data[i].innerText
    );
  }
  var size = 4;
  var delivery_install_table_item_data_text_part = [];
  for (var i = 0; i < delivery_install_table_item_data_text.length; i += size) {
    delivery_install_table_item_data_text_part.push(
      delivery_install_table_item_data_text.slice(i, i + size)
    );
  }

  let national_average_delivery_install = document.getElementsByClassName(
    "national_average_td"
  );
  let national_average_delivery_install_values = [];
  for (let i = 0; i < national_average_delivery_install.length; i++) {
    national_average_delivery_install_values.push(
      national_average_delivery_install[i].innerText
    );
  }

  let delivery_install_input_current_values = [];
  let delivery_install_input_current = Array.from(
    document.getElementsByClassName("member_input_current")
  );

  for (let i = 0; i < delivery_install_input_current.length; i++) {
    delivery_install_input_current_values.push(
      delivery_install_input_current[i].value
    );
  }

  let difference_current_td_values = [];
  let difference_current_td = document.getElementsByClassName(
    "difference_current_td"
  );

  for (let i = 0; i < difference_current_td.length; i++) {
    difference_current_td_values.push(difference_current_td[i].innerText);
  }

  let delivery_install_input_new_values = [];
  let delivery_install_input_new =
    document.getElementsByClassName("member_input_new");

  for (let i = 0; i < delivery_install_input_new.length; i++) {
    delivery_install_input_new_values.push(delivery_install_input_new[i].value);
  }

  let difference_new_td_values = [];
  let difference_new_td = document.getElementsByClassName("difference_new_td");
  for (let i = 0; i < difference_new_td.length; i++) {
    difference_new_td_values.push(difference_new_td[i].innerText);
  }

  let csv_arr = [];
  let csv_sub_arr = [];
  csv_arr.push(header_names);

  for (let i = 0; i < delivery_install_table.rows.length - 1; i++) {
    for (let j = 0; j < 4; j++) {
      csv_sub_arr.push(delivery_install_table_item_data_text_part[i][j]);
    }
    csv_sub_arr.push(national_average_delivery_install_values[i]);
    csv_sub_arr.push(delivery_install_input_current_values[i]);
    csv_sub_arr.push(difference_current_td_values[i]);
    csv_sub_arr.push(delivery_install_input_new_values[i]);
    csv_sub_arr.push(difference_new_td_values[i]);
    csv_arr.push(csv_sub_arr);
    csv_sub_arr = [];
  }
  csv_arr.push([""])

  return csv_arr;

  // Use map function to traverse on each row
  var csv = csv_arr
    .map((item) => {
      // Here item refers to a row in that 2D array
      var row = item;

      // Now join the elements of row with "," using join function
      return row.join(",");
    }) // At this point we have an array of strings
    .join("\n");

  download(csv, "delivery_install_csv");

  // Join the array of strings with "\n"
}

function downloadDataFourPiece() {
  header_names = [];
  let headers = Array.from(document.getElementsByClassName("header"));
  for (let i = 0; i < headers.length; i++) {
    header_names.push(headers[i].innerText);
  }
  let four_piece_kitchen_table = document.getElementById(
    "four_piece_kitchen_table"
  );
  let four_piece_kitchen_table_item_data = Array.from(
    four_piece_kitchen_table.querySelectorAll("td.item_data")
  );

  let four_piece_kitchen_table_item_data_text = [];

  for (let i = 0; i < four_piece_kitchen_table_item_data.length; i++) {
    four_piece_kitchen_table_item_data_text.push(
      four_piece_kitchen_table_item_data[i].innerText
    );
  }
  var size = 4;
  var four_piece_kitchen_table_item_data_text_part = [];
  for (
    var i = 0;
    i < four_piece_kitchen_table_item_data_text.length;
    i += size
  ) {
    four_piece_kitchen_table_item_data_text_part.push(
      four_piece_kitchen_table_item_data_text.slice(i, i + size)
    );
  }

  let national_average_four_piece_kitchen = document.getElementsByClassName(
    "national_average_td_four_piece"
  );
  let national_average_four_piece_kitchen_values = [];
  for (let i = 0; i < national_average_four_piece_kitchen.length; i++) {
    national_average_four_piece_kitchen_values.push(
      national_average_four_piece_kitchen[i].innerText
    );
  }

  let four_piece_kitchen_price_current_values = [];
  let four_piece_kitchen_price_current = Array.from(
    document.getElementsByClassName("dealers_current_four_piece")
  );

  for (let i = 0; i < four_piece_kitchen_price_current.length; i++) {
    four_piece_kitchen_price_current_values.push(
      four_piece_kitchen_price_current[i].innerText
    );
  }

  let difference_current_four_piece_kitchen_values = [];
  let difference_current_four_piece_kitchen = document.getElementsByClassName(
    "difference_current_td_four_piece"
  );

  for (let i = 0; i < difference_current_four_piece_kitchen.length; i++) {
    difference_current_four_piece_kitchen_values.push(
      difference_current_four_piece_kitchen[i].innerText
    );
  }

  let four_piece_kitchen_price_new_values = [];
  let four_piece_kitchen_price_new = document.getElementsByClassName(
    "dealers_new_four_piece"
  );

  for (let i = 0; i < four_piece_kitchen_price_new.length; i++) {
    four_piece_kitchen_price_new_values.push(
      four_piece_kitchen_price_new[i].innerText
    );
  }

  let difference_new_four_piece_kitchen_values = [];
  let difference_new_four_piece_kitchen = document.getElementsByClassName(
    "difference_new_td_four_piece"
  );
  for (let i = 0; i < difference_new_four_piece_kitchen.length; i++) {
    difference_new_four_piece_kitchen_values.push(
      difference_new_four_piece_kitchen[i].innerText
    );
  }

  let csv_arr = [];
  let csv_sub_arr = [];
  csv_arr.push(["4 Piece Kitchen"]);

  for (let i = 0; i < four_piece_kitchen_table.rows.length; i++) {
    for (let j = 0; j < 4; j++) {
      csv_sub_arr.push(four_piece_kitchen_table_item_data_text_part[i][j]);
    }
    csv_sub_arr.push(national_average_four_piece_kitchen_values[i]);
    csv_sub_arr.push(four_piece_kitchen_price_current_values[i]);
    csv_sub_arr.push(difference_current_four_piece_kitchen_values[i]);
    csv_sub_arr.push(four_piece_kitchen_price_new_values[i]);
    csv_sub_arr.push(difference_new_four_piece_kitchen_values[i]);
    csv_arr.push(csv_sub_arr);
    csv_sub_arr = [];
  }

  let delivery_install_current_delta = document.getElementById(
    "delivery_install_current_delta"
  ).innerText;
  let delivery_install_kitchens_delivered_weekly = document.getElementById(
    "delivery_install_kitchens_delivered_weekly"
  ).value;
  let delivery_install_current_annualized = document.getElementById(
    "delivery_install_current_annualized"
  ).innerText;

  csv_arr.push(
    ["Current Delta From Average", delivery_install_current_delta],
    ["Kitchens Delivered Weekly", delivery_install_kitchens_delivered_weekly],
    ["Annualized", delivery_install_current_annualized]
  );

  let delivery_install_new_delta = document.getElementById(
    "delivery_install_new_delta"
  ).innerText;
  let four_piece_delta_from_current_price = document.getElementById(
    "four_piece_delta_from_current_price"
  ).innerText;
  let delivery_install_kitchens_delivered_weekly_new = document.getElementById(
    "delivery_install_kitchens_delivered_weekly_new"
  ).value;
  let delivery_install_new_annualized = document.getElementById(
    "delivery_install_new_annualized"
  ).innerText;
  let delivery_install_delta_from_current_price_annualized =
    document.getElementById(
      "delivery_install_delta_from_current_price_annualized"
    ).innerText;

  csv_arr.push(
    [
      "New Delta From Average",
      delivery_install_new_delta,
      "Delta From Current Price",
      four_piece_delta_from_current_price,
    ],
    [
      "Kitchens Delivered Weekly",
      delivery_install_kitchens_delivered_weekly_new,
    ],
    [
      "Annualized",
      delivery_install_new_annualized,
      "Annualized",
      delivery_install_delta_from_current_price_annualized,
    ]
  );
  csv_arr.push([""])

  return csv_arr;
  // Use map function to traverse on each row
  var csv = csv_arr
    .map((item) => {
      // Here item refers to a row in that 2D array
      var row = item;

      // Now join the elements of row with "," using join function
      return row.join(",");
    }) // At this point we have an array of strings
    .join("\n");

  download(csv, "four_piece_kitchen");

  // Join the array of strings with "\n"
}

function downloadDataLaundry() {
  header_names = [];
  let headers = Array.from(document.getElementsByClassName("header"));
  for (let i = 0; i < headers.length; i++) {
    header_names.push(headers[i].innerText);
  }
  let laundry_table = document.getElementById("laundry_table");
  let laundry_table_item_data = Array.from(
    laundry_table.querySelectorAll("td.item_data_laundry")
  );

  let laundry_table_item_data_text = [];

  for (let i = 0; i < laundry_table_item_data.length; i++) {
    laundry_table_item_data_text.push(laundry_table_item_data[i].innerText);
  }
  var size = 4;
  var laundry_table_item_data_text_part = [];
  for (var i = 0; i < laundry_table_item_data_text.length; i += size) {
    laundry_table_item_data_text_part.push(
      laundry_table_item_data_text.slice(i, i + size)
    );
  }

  let national_average_td_laundry = document.getElementsByClassName(
    "national_average_td_laundry"
  );
  let national_average_td_laundry_values = [];
  for (let i = 0; i < national_average_td_laundry.length; i++) {
    national_average_td_laundry_values.push(
      national_average_td_laundry[i].innerText
    );
  }

  let member_input_current_td_laundry_values = [];
  let member_input_current_td_laundry = Array.from(
    document.getElementsByClassName("member_input_current_laundry")
  );

  for (let i = 0; i < member_input_current_td_laundry.length; i++) {
    member_input_current_td_laundry_values.push(
      member_input_current_td_laundry[i].value
    );
  }

  let difference_current_td_laundry_values = [];
  let difference_current_td_laundry = document.getElementsByClassName(
    "difference_current_td_laundry"
  );

  for (let i = 0; i < difference_current_td_laundry.length; i++) {
    difference_current_td_laundry_values.push(
      difference_current_td_laundry[i].innerText
    );
  }

  let member_input_new_td_laundry_values = [];
  let member_input_new_td_laundry =
    document.getElementsByClassName("member_input_new_laundry");

  for (let i = 0; i < member_input_new_td_laundry.length; i++) {
    member_input_new_td_laundry_values.push(member_input_new_td_laundry[i].value);
  }

  let difference_new_td_laundry_values = [];
  let difference_new_td_laundry = document.getElementsByClassName("difference_new_td_laundry");
  for (let i = 0; i < difference_new_td_laundry.length; i++) {
    difference_new_td_laundry_values.push(difference_new_td_laundry[i].innerText);
  }

  let csv_arr = [];
  let csv_sub_arr = [];
  csv_arr.push(["Laundry"]);

  for (let i = 0; i < laundry_table.rows.length - 1; i++) {
    for (let j = 0; j < 4; j++) {
      csv_sub_arr.push(laundry_table_item_data_text_part[i][j]);
    }
    csv_sub_arr.push(national_average_td_laundry_values[i]);
    csv_sub_arr.push(member_input_current_td_laundry_values[i]);
    csv_sub_arr.push(difference_current_td_laundry_values[i]);
    csv_sub_arr.push(member_input_new_td_laundry_values[i]);
    csv_sub_arr.push(difference_new_td_laundry_values[i]);
    csv_arr.push(csv_sub_arr);
    csv_sub_arr = [];
  }
  csv_arr.push([""])
  return csv_arr

  // Use map function to traverse on each row
  var csv = csv_arr
    .map((item) => {
      // Here item refers to a row in that 2D array
      var row = item;

      // Now join the elements of row with "," using join function
      return row.join(",");
    }) // At this point we have an array of strings
    .join("\n");

  download(csv, "laundry");

  // Join the array of strings with "\n"
}

function downloadDataLaundryCalc() {
  header_names = [];
  let headers = Array.from(document.getElementsByClassName("header"));
  for (let i = 0; i < headers.length; i++) {
    header_names.push(headers[i].innerText);
  }
  let laundry_calculator_table = document.getElementById(
    "laundry_calculator_table"
  );
  let laundry_calculator_table_item_data = Array.from(
    laundry_calculator_table.querySelectorAll("td.item_data_laundry")
  );

  let laundry_calculator_table_item_data_text = [];

  for (let i = 0; i < laundry_calculator_table_item_data.length; i++) {
    laundry_calculator_table_item_data_text.push(
      laundry_calculator_table_item_data[i].innerText
    );
  }
  var size = 4;
  var laundry_calculator_table_item_data_text_part = [];
  for (
    var i = 0;
    i < laundry_calculator_table_item_data_text.length;
    i += size
  ) {
    laundry_calculator_table_item_data_text_part.push(
      laundry_calculator_table_item_data_text.slice(i, i + size)
    );
  }

  let national_average_td_four_piece_laundry_calc = document.getElementsByClassName(
    "national_average_td_four_piece_laundry_calc"
  );
  let national_average_td_four_piece_laundry_calc_values = [];
  for (let i = 0; i < national_average_td_four_piece_laundry_calc.length; i++) {
    national_average_td_four_piece_laundry_calc_values.push(
      national_average_td_four_piece_laundry_calc[i].innerText
    );
  }

  let dealers_current_laundry_calc_values = [];
  let dealers_current_laundry_calc = Array.from(
    document.getElementsByClassName("dealers_current_laundry_calc")
  );

  for (let i = 0; i < dealers_current_laundry_calc.length; i++) {
    dealers_current_laundry_calc_values.push(
      dealers_current_laundry_calc[i].innerText
    );
  }

  let difference_current_td_laundry_calc_values = [];
  let difference_current_td_laundry_calc = document.getElementsByClassName(
    "difference_current_td_laundry_calc"
  );

  for (let i = 0; i < difference_current_td_laundry_calc.length; i++) {
    difference_current_td_laundry_calc_values.push(
      difference_current_td_laundry_calc[i].innerText
    );
  }

  let dealers_new_laundry_calc_values = [];
  let dealers_new_laundry_calc = document.getElementsByClassName(
    "dealers_new_laundry_calc"
  );

  for (let i = 0; i < dealers_new_laundry_calc.length; i++) {
    dealers_new_laundry_calc_values.push(
      dealers_new_laundry_calc[i].innerText
    );
  }

  let difference_new_td_laundry_calc_values = [];
  let difference_new_td_laundry_calc = document.getElementsByClassName(
    "difference_new_td_laundry_calc"
  );
  for (let i = 0; i < difference_new_td_laundry_calc.length; i++) {
    difference_new_td_laundry_calc_values.push(
      difference_new_td_laundry_calc[i].innerText
    );
  }

  let csv_arr = [];
  let csv_sub_arr = [];
  csv_arr.push(["Laundry Calculator"]);

  for (let i = 0; i < laundry_calculator_table.rows.length; i++) {
    for (let j = 0; j < 4; j++) {
      csv_sub_arr.push(laundry_calculator_table_item_data_text_part[i][j]);
    }
    csv_sub_arr.push(national_average_td_four_piece_laundry_calc_values[i]);
    csv_sub_arr.push(dealers_current_laundry_calc_values[i]);
    csv_sub_arr.push(difference_current_td_laundry_calc_values[i]);
    csv_sub_arr.push(dealers_new_laundry_calc_values[i]);
    csv_sub_arr.push(difference_new_td_laundry_calc_values[i]);
    csv_arr.push(csv_sub_arr);
    csv_sub_arr = [];
  }

  let laundry_current_delta = document.getElementById(
    "laundry_current_delta"
  ).innerText;
  let laundry_pairs_delivered_weekly = document.getElementById(
    "laundry_pairs_delivered_weekly"
  ).value;
  let laundry_current_annualized = document.getElementById(
    "laundry_current_annualized"
  ).innerText;

  csv_arr.push(
    ["Current Delta From Average", laundry_current_delta],
    ["Laundry Pairs Delivered Weekly", laundry_pairs_delivered_weekly],
    ["Annualized", laundry_current_annualized]
  );

  let laundry_new_delta = document.getElementById(
    "laundry_new_delta"
  ).innerText;
  let laundry_delta_from_current_price = document.getElementById(
    "laundry_delta_from_current_price"
  ).innerText;
  let laundry_pairs_delivered_weekly_new = document.getElementById(
    "laundry_pairs_delivered_weekly_new"
  ).value;
  let laundry_new_annualized = document.getElementById(
    "laundry_new_annualized"
  ).innerText;
  let laundry_delta_from_current_price_annualized =
    document.getElementById(
      "laundry_delta_from_current_price_annualized"
    ).innerText;

  csv_arr.push(
    [
      "New Delta From Average",
      laundry_new_delta,
      "Delta From Current Price",
      laundry_delta_from_current_price,
    ],
    [
      "Laundry Pairs Delivered Weekly",
      laundry_pairs_delivered_weekly_new,
    ],
    [
      "Annualized",
      laundry_new_annualized,
      "Annualized",
      laundry_delta_from_current_price_annualized,
    ]
  );

  let sum_current = document.getElementById("sum_current").innerText;
  csv_arr.push(["Total Current Potential Annualized", sum_current])

  let sum_new = document.getElementById("sum_new").innerText;
  csv_arr.push(["Total New Potential Annualized", sum_new])

  return csv_arr
  // Use map function to traverse on each row
  var csv = csv_arr
    .map((item) => {
      // Here item refers to a row in that 2D array
      var row = item;

      // Now join the elements of row with "," using join function
      return row.join(",");
    }) // At this point we have an array of strings
    .join("\n");

  download(csv, "laundry_calc");

  // Join the array of strings with "\n"
}

function consolidateCSV() {
  let delivery_install_data = downloadDataDeliveryInstall();
  let four_piece_data = downloadDataFourPiece();
  let laundry_data = downloadDataLaundry();
  let laundry_calc_data = downloadDataLaundryCalc();

  let consolidated = delivery_install_data.concat(four_piece_data,laundry_data, laundry_calc_data)
  return consolidated;
}

function downloadResults() {
  let results = consolidateCSV();
  var csv = results
    .map((item) => {
      // Here item refers to a row in that 2D array
      var row = item;

      // Now join the elements of row with "," using join function
      return row.join(",");
    }) // At this point we have an array of strings
    .join("\n");

  download(csv, "results");

  let sum_current = document.getElementById("sum_current").innerText;
  let sum_new = document.getElementById("sum_new").innerText;

  let user_email = document.getElementById("user_email").value;

  dataLayer.push({
    event: "download",
    user_email: user_email,
    total_opportunity_current: sum_current,
    total_opportunity_new: sum_new
  });
}

function sendEmail() {
  //using email.js
  let results = consolidateCSV();

  const results_blob = new Blob([results], {
    type: "text/csv",
  });
  const results_url = URL.createObjectURL(results_blob);

  let sum_current = document.getElementById("sum_current").innerText;
  let sum_new = document.getElementById("sum_new").innerText;

  let user_email = document.getElementById("user_email").value;

  let templateParams = {
    email: user_email,
    results: results_url
  };

  let templateParamsLead = {
    to_email: "marketing@avb.net",
    email: user_email,
    results_current: sum_current,
    results_new: sum_new,
    results_link: results_url
  };

  //user email
  emailjs.send("service_6c8n4sr", "template_f2n852j", templateParams).then(
    (response) => {
      alert("Check Your Inbox For Links To Your Files");
      console.log("SUCCESS!", response.status, response.text);
    },
    (error) => {
      console.log("FAILED...", error);
    }
  );

  
  //lead email
  emailjs.send("service_6c8n4sr", "template_dljxoxl", templateParamsLead).then(
    (response) => {
      console.log("SUCCESS!", response.status, response.text);
    },
    (error) => {
      console.log("FAILED...", error);
    }
  );


  dataLayer.push({
    event: "email_submitted",
    user_email: user_email,
    total_opportunity_current: sum_current,
    total_opportunity_new: sum_new,
  });
}

