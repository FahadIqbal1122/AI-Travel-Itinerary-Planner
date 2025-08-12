import React, { useEffect, useRef } from "react"

const DestinationAutocomplete = ({ value, onChange, onSelect }) => {
  const inputRef = useRef(null)

  useEffect(() => {
    let autocomplete

    function initAutocomplete() {
      autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: [], 
      })
      autocomplete.setFields(["place_id", "formatted_address", "geometry", "name"])

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()
        if (!place.place_id || !place.geometry) {
          onSelect(null)
          onChange(inputRef.current.value)
          return
        }
        const selected = {
          placeId: place.place_id,
          address: place.formatted_address || place.name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }
        if (inputRef.current) inputRef.current.value = selected.address
        onChange(selected.address)
        onSelect(selected)
      })
    }

    if (!window.google) {
      const script = document.createElement("script")
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.onload = initAutocomplete
      document.body.appendChild(script)
    } else {
      initAutocomplete()
    }
  }, [])

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value || ""
    }
  }, [value])

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Destination (city or area)"
      onChange={(e) => {
        onChange(e.target.value)
        onSelect(null)
      }}
      required
    />
  )
}

export default DestinationAutocomplete
