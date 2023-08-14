{
  "targets": [
    {
      "target_name": "erl",
      "sources": [ "erl.cc" ],
      'include_dirs': [
        '<!(node -e \"require(\'nan\')\")',
      ]
    }
  ]
}
