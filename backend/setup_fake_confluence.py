import os
import sys
from atlassian import Confluence
from dotenv import load_dotenv

# Load env from .env file
load_dotenv(".env")

url = os.environ.get("CONFLUENCE_URL")
username = os.environ.get("CONFLUENCE_USERNAME")
token = os.environ.get("CONFLUENCE_API_TOKEN")

if not url or not username or not token:
    print("Error: Missing Confluence credentials in .env")
    sys.exit(1)

print(f"Connecting to {url}...")
confluence = Confluence(
    url=url,
    username=username,
    password=token,
    cloud=True
)

def create_scenario():
    # 1. Find a Space
    print("Finding a space to publish to...")
    try:
        spaces = confluence.get_all_spaces(start=0, limit=5, expand='description.plain,homepage')
        if not spaces.get('results'):
            print("No spaces found! Cannot create page.")
            return

        # Prefer a global space over personal if possible, but take first available
        target_space = spaces['results'][0]
        space_key = target_space['key']
        print(f"Selected Space: {target_space['name']} (Key: {space_key})")

        # 2. Define Content
        title = "Payment Gateway V2 Migration Guide"
        body = """
        <h3>Critical Update for All Teams</h3>
        <p>We are migrating to the new V2 Gateway API to improve reliability.</p>
        <div class="confluence-information-macro confluence-information-macro-warning">
            <span class="aui-icon aui-icon-small aui-iconfont-error confluence-information-macro-icon"></span>
            <div class="confluence-information-macro-body">
                <p><strong>Breaking Change:</strong></p>
                <p>All <code>charge</code> requests to the V2 API require an <strong>Idempotency-Key</strong> header.</p>
                <p>If you do not provide this key, the request will be rejected to prevent duplicate charges during network timeouts.</p>
            </div>
        </div>
        <h4>Example Implementation:</h4>
        <pre><code class="language-python">headers = {"Idempotency-Key": str(uuid.uuid4())}
response = gateway.charge(amount, token, headers=headers)</code></pre>
        <p><em>Please update your payment processors immediately.</em></p>
        """

        # 3. Create Page
        print(f"Creating page '{title}'...")
        # Check if exists first to avoid error
        if confluence.page_exists(space_key, title):
            print("Page already exists. Updating it...")
            page_id = confluence.get_page_id(space_key, title)
            confluence.update_page(page_id, title, body)
            print(f"Page updated! ID: {page_id}")
        else:
            status = confluence.create_page(space=space_key, title=title, body=body)
            print(f"Page created! ID: {status['id']}")
            print(f"URL: {status['_links']['base']}{status['_links']['webui']}")

    except Exception as e:
        print(f"Failed to create page: {e}")

if __name__ == "__main__":
    create_scenario()
