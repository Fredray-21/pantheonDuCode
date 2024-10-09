#include <iostream>
#include <curl/curl.h>
#include <libxml/HTMLparser.h>
#include <libxml/xpath.h>
#include <string>
#include <iomanip>
#include <vector>
#include <algorithm>
#include <numeric>
#include <thread> 
#include <chrono>

#ifdef _WIN32
#include <windows.h>
#endif

size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* s) {
    size_t newLength = size * nmemb;
    s->append((char*)contents, newLength);
    return newLength;
}

// Fonction de progress pour afficher le %
int ProgressCallback(double totalToDownload, double nowDownloaded, double totalToUpload, double nowUploaded) {
    if (totalToDownload > 0) {
        double percentage = (nowDownloaded / totalToDownload) * 100.0;
        std::cout << "\rTéléchargement en cours... " << std::fixed << std::setprecision(2) << percentage << "%";
        std::cout.flush();
    }
    return 0;
}

// Petite fonction de trim trklment
std::string trim(const std::string& str) {
    std::string trimmed = str;
    trimmed.erase(trimmed.begin(), std::find_if(trimmed.begin(), trimmed.end(), [](unsigned char ch) {
        return !std::isspace(ch);
        }));
    trimmed.erase(std::find_if(trimmed.rbegin(), trimmed.rend(), [](unsigned char ch) {
        return !std::isspace(ch);
        }).base(), trimmed.end());
    return trimmed;
}

// PEtite fonction pour dl une page
std::string downloadPage(const std::string& url) {
    CURL* curl;
    CURLcode res;
    std::string pageContent;

    curl = curl_easy_init();
    if (curl) {
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &pageContent);
        curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

        // Callback de progression
        curl_easy_setopt(curl, CURLOPT_PROGRESSFUNCTION, ProgressCallback);
        curl_easy_setopt(curl, CURLOPT_NOPROGRESS, 0L);

        // Start du dl
        res = curl_easy_perform(curl);

        std::cout << std::endl; // saut d eligne

        if (res != CURLE_OK) {
            std::cerr << "Erreur lors du téléchargement de la page : " << curl_easy_strerror(res) << std::endl;
        }

        curl_easy_cleanup(curl);
    }
    else {
        std::cerr << "Erreur lors de l'initialisation de CURL" << std::endl;
    }

    return pageContent;
}

// Structure d"un object
struct IsuObject {
    std::string title;
    std::string smallText;
    std::string href;
    std::vector<std::string> owners;
};

// On recupère les Owners depuis la nouvelle page pour chaque object
void extractOwners(IsuObject& obj) {
    std::string pageContent = downloadPage("https://assassinscreed.fandom.com" + obj.href);
    if (pageContent.empty()) {
        std::cerr << "Le contenu de la page " << obj.href << " est vide. Vérifiez l'URL." << std::endl;
        return;
    }

    htmlDocPtr doc = htmlReadMemory(pageContent.c_str(), pageContent.size(), NULL, NULL, HTML_PARSE_NOERROR | HTML_PARSE_NOWARNING);
    if (!doc) {
        std::cerr << "Erreur lors du parsing de la page de l'objet" << std::endl;
        return;
    }

    xmlXPathContextPtr xpathCtx = xmlXPathNewContext(doc);
    if (!xpathCtx) {
        std::cerr << "Erreur lors de la création du contexte XPath" << std::endl;
        xmlFreeDoc(doc);
        return;
    }

    // Ptn c'est un banger cette ecriture c'est trop bien 
    std::string xpathExpr = "//span[@id='Owners']/../following-sibling::ul[1]/li";
    xmlXPathObjectPtr xpathObj = xmlXPathEvalExpression((const xmlChar*)xpathExpr.c_str(), xpathCtx);
    if (!xpathObj) {
        std::cerr << "Erreur lors de l'évaluation de l'expression XPath pour les propriétaires" << std::endl;
        xmlXPathFreeContext(xpathCtx);
        xmlFreeDoc(doc);
        return;
    }

    // les nodes
    xmlNodeSetPtr nodes = xpathObj->nodesetval;

    if (nodes != nullptr) {
        for (size_t i = 0; i < nodes->nodeNr; ++i) {
            xmlNodePtr li = nodes->nodeTab[i];
            std::string ownerText;
            xmlNodePtr textNode = li->children;

            // on va récup le text et les owners
            while (textNode) {
                // on veux pas des <sup>
                if (textNode->type == XML_ELEMENT_NODE && xmlStrEqual(textNode->name, BAD_CAST "sup")) {
                    textNode = textNode->next;
                    continue;
                }

                // On prend le text du <a> ou du node
                if ((textNode->type == XML_ELEMENT_NODE && xmlStrEqual(textNode->name, BAD_CAST "a")) || textNode->type == XML_TEXT_NODE) {
                    ownerText += (const char*)xmlNodeGetContent(textNode);
                }

                // on passe au prochain node
                textNode = textNode->next; 
            }

            ownerText = trim(ownerText);
            obj.owners.push_back(ownerText);
        }
    }

    // Libération de la mémoir
    xmlXPathFreeObject(xpathObj);
    xmlXPathFreeContext(xpathCtx);
    xmlFreeDoc(doc);
}

// On recup les objects
void extractIsuObjects(const std::string& pageContent) {
    htmlDocPtr doc = htmlReadMemory(pageContent.c_str(), pageContent.size(), NULL, NULL, HTML_PARSE_NOERROR | HTML_PARSE_NOWARNING);
    if (!doc) {
        std::cerr << "Erreur lors du parsing de la page" << std::endl;
        return;
    }

    xmlXPathContextPtr xpathCtx = xmlXPathNewContext(doc);
    if (!xpathCtx) {
        std::cerr << "Erreur lors de la création du contexte XPath" << std::endl;
        xmlFreeDoc(doc);
        return;
    }

    //same on récup les div qui commence par "gallery-" 
    std::string xpathExpr = "//div[starts-with(@id, 'gallery-')]";
    xmlXPathObjectPtr xpathObj = xmlXPathEvalExpression((const xmlChar*)xpathExpr.c_str(), xpathCtx);
    if (!xpathObj) {
        std::cerr << "Erreur lors de l'évaluation de l'expression XPath" << std::endl;
        xmlXPathFreeContext(xpathCtx);
        xmlFreeDoc(doc);
        return;
    }

    xmlNodeSetPtr nodes = xpathObj->nodesetval;

    size_t maxObjectWidth = strlen("Object");
    size_t maxParticularityWidth = strlen("Particularity");
    size_t maxOwnersWidth = 0;

    std::vector<IsuObject> isuObjects;
    
    // on rempli les objects avec les datas
    for (size_t i = 0; i < nodes->nodeNr; i++) {
        xmlNodePtr galleryDiv = nodes->nodeTab[i];

        for (xmlNodePtr child = galleryDiv->children; child; child = child->next) {
            if (child->type == XML_ELEMENT_NODE && xmlStrEqual(child->name, BAD_CAST "div") &&
                xmlStrEqual(xmlGetProp(child, BAD_CAST "class"), BAD_CAST "wikia-gallery-item")) {

                IsuObject obj;
                obj.smallText = "";

                xmlNodePtr caption = child->children;
                while (caption && (!xmlStrEqual(caption->name, BAD_CAST "div") ||
                    !xmlStrEqual(xmlGetProp(caption, BAD_CAST "class"), BAD_CAST "lightbox-caption"))) {
                    caption = caption->next;
                }

                if (caption) {
                    xmlNodePtr currentTag = caption->children;

                    while (currentTag) {
                        if (xmlStrEqual(currentTag->name, BAD_CAST "b")) {
                            xmlNodePtr aTag = currentTag->children;
                            while (aTag && !xmlStrEqual(aTag->name, BAD_CAST "a")) {
                                aTag = aTag->next;
                            }

                            if (aTag && xmlStrEqual(aTag->name, BAD_CAST "a")) {
                                obj.title = (const char*)xmlNodeGetContent(aTag);

                                xmlChar* href = xmlGetProp(aTag, BAD_CAST "href");
                                obj.href = (href ? (const char*)href : "");
                                if (href) xmlFree(href);
                            }
                        }
                        else if (xmlStrEqual(currentTag->name, BAD_CAST "small")) {
                            obj.smallText = (const char*)xmlNodeGetContent(currentTag);
                        }

                        currentTag = currentTag->next;
                    }
                }

                maxObjectWidth = (std::max)(maxObjectWidth, obj.title.size());
                maxParticularityWidth = (std::max)(maxParticularityWidth, obj.smallText.size());
                isuObjects.push_back(obj);
            }
        }
    }

    // on recup les owners de tout les objects
    for (auto& obj : isuObjects) {
        extractOwners(obj);
        maxOwnersWidth = (std::max)(maxOwnersWidth, obj.owners.empty() ? 0 : obj.owners[0].size());
    }

    // Affichage du tableau

    // séparation
    std::cout << "+-" << std::string(maxObjectWidth, '-') << "-+-"
        << std::string(maxParticularityWidth, '-') << "-+-"
        << std::string(maxOwnersWidth, '-') << "-+" << std::endl;

    // Header
    std::cout << "| " << std::left << std::setw(maxObjectWidth) << "Object"
        << " | " << std::left << std::setw(maxParticularityWidth) << "Particularity"
        << " | " << std::left << std::setw(maxOwnersWidth) << "Owners" << " |" << std::endl;
    
    // séparation
    std::cout << "+-" << std::string(maxObjectWidth, '-') << "-+-"
        << std::string(maxParticularityWidth, '-') << "-+-"
        << std::string(maxOwnersWidth, '-') << "-+" << std::endl;

    // Les objects 
    for (const auto& obj : isuObjects) {
        std::cout << "| " << std::left << std::setw(maxObjectWidth) << obj.title
            << " | " << std::left << std::setw(maxParticularityWidth) << obj.smallText
            << " |" << std::endl;

        for (const auto& owner : obj.owners) {
            size_t ownerWidth = (std::min)(owner.length(), maxOwnersWidth);
            std::cout << "| " << std::left << std::setw(maxObjectWidth) << " "
                << " | " << std::left << std::setw(maxParticularityWidth) << " "
                << " | " << std::left << std::setw(ownerWidth) << owner << std::endl;
        }

        // séparation entre chaque objects
        std::cout << "+-" << std::string(maxObjectWidth, '-') << "-+-"
            << std::string(maxParticularityWidth, '-') << "-+-"
            << std::string(maxOwnersWidth, '-') << "-+" << std::endl;
    }

    // libération de la mémoire
    xmlXPathFreeObject(xpathObj);
    xmlXPathFreeContext(xpathCtx);
    xmlFreeDoc(doc);
}

int main() {
#ifdef _WIN32
    SetConsoleOutputCP(CP_UTF8); // Sortie console windows en UTF-8
#endif

    std::string url = "https://assassinscreed.fandom.com/wiki/Piece_of_Eden";

    std::string pageContent = downloadPage(url);
    if (pageContent.empty()) {
        std::cerr << "Le contenu de la page est vide. Vérifiez l'URL." << std::endl;
        return 1;
    }

    extractIsuObjects(pageContent);

    return 0;
}