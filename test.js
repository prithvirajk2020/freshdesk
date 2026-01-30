import axios from "axios";

const FRESHDESK_DOMAIN = "tatvacloud-helpdesk.freshdesk.com";
console.log(FRESHDESK_DOMAIN)
const FRESHDESK_API_KEY = "LXJOTzAtZzVHTTNkRk93SFFHekw=";
console.log(FRESHDESK_API_KEY)
async function test() {
    try {
        const response = await axios.get(
            `https://${FRESHDESK_DOMAIN}/api/v2/search/tickets?query="cf_case_id : '12345' AND cf_category : 'Service'"`,
            {
                headers: {
                    Authorization: `basic ${FRESHDESK_API_KEY}`, // RAW API KEY ONLY
                }
            }
        );
        console.log(response.data)
    } catch (error) {
        console.log(error.response.data)
    }

}


test();
