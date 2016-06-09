# loopback-filters-mixin

Post database filtering through the 'select' query parameter

* npm install loopback-filters-mixin --save

```JSON
{
  "where": {
    "type": "new"
  },
  "then": {
    "include": {
      "relation": "files",
      "where": {
        "status": "archived"
      }
    },
    "having": {
      "statusId": 12
    },
    "then": {
      "limit": 2,
      "finally": {}
    }
  }
}
```