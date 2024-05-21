
$(document).ready(function () {
    document.title = "Verilerini Düzenle - Developed by CagatayD";

    $("#add_list").click(function () {
        let list = document.querySelector("#xml_list > div.row"), div = document.createElement("div"); div.classList.add("col-4", "mb-3");
        div.innerHTML = `<div class="input-group"><input type="text" class="form-control" name="name"><input type="text" class="form-control" name="value"></div>`; list.appendChild(div)
    })

    $("#start:not(.disabled)").click(start);
});

function randomKey() {
    let key = "abcdefghijklmnopqrstuvwxyz0123456789".split(""), random = "";
    for (let i = 0; i < 6; i++) random += key[Math.floor(Math.random() * key.length)];
    return random;
}

function abort(text, refresh = true) { alert(text); if (refresh) return document.location.reload(); }
const readfile = async (file) => new Promise(r => { let content = new FileReader(); content.readAsText(file, "UTF-8"); content.onload = a => r(a.target.result); content.onerror = () => abort("Bir şeyler yolunda gitmedi. #readfile") })

async function start() {
    //$("#start").addClass("disabled");

    let xml_input = document.getElementById("xml-input").files;
    let csv_input = document.getElementById("csv-input").files;

    if (xml_input.length !== 1) return abort("XML Dosyası Düzgün Seçilmedi!", false);
    else if (csv_input.length < 1) return abort("Hiçbir CSV Dosyası Seçilmedi!", false);

    // I know csv_filter is not used anywhere. Because i don't think anyone will uses this package.
    let xml_content = (await readfile(xml_input[0])).split("\n"), csv_content = "", csv_filter = "", variables = { category: String($("#category").val()).trim().toLowerCase().split(","), csv_trash: Number($("#trash-lines").val()), csv_filter: Number($("#filter-line").val()) - 1 }
    for (var i = 0; i < csv_input.length; i++) {
        let content = String(await readfile(csv_input[i])).split("\n");
        csv_filter = content.splice(variables.csv_filter, 1); content.splice(0, variables.csv_trash);
        csv_content = csv_content + content.join("\n") + "\n";
    }

    let xml_list = $("#xml_list")[0].elements, xml_filter = {};
    for (var i = 0; i < xml_list.length; i++) { let e = _ => xml_list[_].value; if ((i % 2) === 0) xml_filter[e(i)] = e(i + 1) }



    let newLine = { category: [], alinti: 0, ozelhaber: 0 }, data = [];
    xml_content.forEach((line, index) => {
        if (line.includes("<item>")) newLine = { category: [], alinti: 0, ozelhaber: 0 };
        else if (line.includes("</item>")) data.push(newLine);
        else Object.entries(xml_filter).forEach(([a, b]) => { if (line.includes(b)) { if (a === "category") newLine.category.push(line); else newLine[a] = line; } });

        // Ending
        if (index === xml_content.length - 1) {
            let qdata = []
            data.forEach((a, i) => {
                Object.entries(xml_filter).forEach(([key, elem]) => {
                    if (key === "category") {
                        a.category.forEach((b, ii) => {
                            a.category[ii] = String(b).replace("<category domain=\"category\" nicename=\"", "").replace("\">", "").replace("</category>", "").trimStart().trimEnd();
                            a.category[ii] = String(a.category[ii]).substring(0, String(a.category[ii]).length / 2).replace("<![CDA", "").replace("<![C", "");

                            // Ozel
                            if (a.category[ii] === "diger-siteler") a.alinti = 1;
                            if (a.category[ii] === "ozel-haber") a.ozelhaber = 1;
                        });

                        let cat = variables.category.find(_ => a.category.find(__ => _ === __));
                        // Spesifik Kategori
                        a.category = cat ? cat : null;

                    } else a[key] = String(a[key]).replace(elem, "").replace(elem.replace("<", "</"), "").trimStart().trimEnd().replace("<![CDATA[", "").replace("]]>", "");
                    qdata.push(a);

                    // Ending
                    if (i === data.length - 1) {
                        data = qdata.filter(_ => _.category !== null && _.post_type === "post");
                        data = data.filter((v, i, _a) => _a.findIndex(v2 => (v2.id === v.id)) === i);

                        $("#total").text(data.length);
                        $("#ozelhaber").text(data.filter(_ => _.ozelhaber === 1).length);
                        $("#alintihaber").text(data.filter(_ => _.alinti === 1).length);

                        let analCache = [], anal = csv_content.split("\n");
                        anal.forEach((a_line, a_index) => {
                            let b = a_line.split(","), c = data.find(d => String(b[0]).includes(d.post_name) || String(b[0]).includes("/" + d.id)); // ? Check place

                            if (c) analCache.push({ ...c, users: b[1], view_count: b[2], click_count: b[3], view_of_user_count: b[4], average_click_count: b[5], average_session_time: String(b[6]).replace("\r", ""), nodata: !1 });


                            if (a_index === anal.length - 1) {
                                data = data.filter(z => !analCache.find(q => z?.id === q?.id));
                                $("#nodata").text(data.length);
                                $("#math").text(Number($("#total")[0].innerHTML) - data.length);

                                data.forEach((w, i) => {
                                    analCache.push({ ...w, users: -1, view_count: -1, click_count: -1, view_of_user_count: -1, average_click_count: -1, average_session_time: -1, nodata: !0 });

                                    if (i === data.length - 1) {
                                        analCache = analCache.sort((_a, _b) => new Date(_a.post_date).getTime() - new Date(_b.post_date).getTime()); // Sort by post_date
                                        analCache = analCache.filter((v, i, _a) => _a.findIndex(v2 => (v2.id === v.id)) === i); // Removes duplicates

                                        analCache.forEach((e, e_i) => {
                                            let date = new Date(e.post_date), f = (g) => { if (String(g).length === 1) return "0" + g; else return g }
                                            analCache[e_i].post_date = `${f(date.getDate())}-${f(date.getMonth() + 1)} ${f(date.getHours())}:${f(date.getMinutes())}`;

                                            if (e_i === analCache.length - 1) return exportJson(analCache, true);
                                        })
                                    }
                                })
                            }
                        })
                    }

                });
            })
        }
    })

    function exportJson(data, exportcsv = false) {
        console.log("finish");
        let btn = $("#export-json"), json = new Blob([JSON.stringify(data, null, 4)], { type: "text/json" });
        let link = window.URL.createObjectURL(json);
        btn.removeClass("disabled"); btn.attr("href", link);

        if (exportcsv) {
            exportCSV(data.filter(x => x.nodata === true), "exportjustnodata");
            exportCSV(data.filter(x => x.nodata === false), "exportjusthasdata");
            return exportCSV(data, "export-csv");
        }
    }

    function exportCSV(data, id) {
        var text = `Sayfa yolu ve ekran sinifi,Goruntuleme Sayisi,Etkinlik sayisi,Ortalama etkilesim suresi,Ortalama oturum suresi,Kategori,ID,Alinti,Ozel,Tarih,NoData\n`;

        data.forEach((a, i) => {
            text += `${a.post_name},${a.view_count},${a.click_count},${a.average_click_count},${a.average_session_time},${a.category},${a.id},${a.alinti ? "Evet" : "Hayir"},${a.ozelhaber ? "Evet" : "Hayir"},${a.post_date},${a.nodata ? "Evet" : "Hayir"}\n`;
            if (i === data.length - 1) {
                let btn = $("#" + id), csv = new Blob([text], { type: "text/csv" });
                let link = window.URL.createObjectURL(csv);
                btn.removeClass("disabled"); btn.attr("href", link);
            };
        })
    }

}